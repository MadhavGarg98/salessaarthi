const express = require('express');
const { db } = require('../firebase');
const twilioService = require('../services/twilioService');

const router = express.Router();

// GET /api/chats - Get all active chats (grouped by customer phone number)
router.get('/', async (req, res) => {
  try {
    const chatsSnapshot = await db.collection('chats').orderBy('timestamp', 'desc').get();
    
    const chatsMap = new Map();
    
    // We can also fetch all users to get their details (like name)
    const usersSnapshot = await db.collection('users').get();
    const usersMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      usersMap.set(doc.id, doc.data());
    });
    
    chatsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const phone = data.userId;
      if (!phone) return;
      
      if (!chatsMap.has(phone)) {
        const user = usersMap.get(phone) || {};
        
        // Format relative last message time
        let relativeTime = 'Just now';
        if (data.timestamp) {
          const diffMs = Date.now() - data.timestamp.toDate().getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          
          if (diffMins < 1) relativeTime = 'Just now';
          else if (diffMins < 60) relativeTime = `${diffMins}m ago`;
          else if (diffHours < 24) relativeTime = `${diffHours}h ago`;
          else relativeTime = data.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
        
        chatsMap.set(phone, {
          id: phone,
          customerName: user.name || user.tempData?.name || `Customer (${phone.slice(-4)})`,
          phone: phone,
          lastMessage: data.reply || data.message || '',
          lastMessageTime: relativeTime,
          unreadCount: 0,
          isActive: user.stage !== 'converted'
        });
      }
    });
    
    const recentChats = Array.from(chatsMap.values());
    
    res.json({
      success: true,
      recentChats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chats' });
  }
});

// GET /api/chats/:phone/messages - Get message history for a specific customer
router.get('/:phone/messages', async (req, res) => {
  try {
    const { phone } = req.params;
    const chatsSnapshot = await db.collection('chats')
      .where('userId', '==', phone)
      .get();
      
    const docs = chatsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually by timestamp in JS to avoid requiring a Firestore composite index
    docs.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      return timeA - timeB;
    });
      
    const messages = [];
    docs.forEach(doc => {
      const data = doc;
      const id = doc.id;
      const timeStr = data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      
      // A single document contains the user message and the bot/agent reply
      if (data.message) {
        messages.push({
          id: id + '_user',
          text: data.message,
          sender: 'user',
          timestamp: timeStr
        });
      }
      if (data.reply) {
        messages.push({
          id: id + '_bot',
          text: data.reply,
          sender: 'bot',
          timestamp: timeStr
        });
      }
    });
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// POST /api/chats/:phone/messages - Send a manual reply to a customer via WhatsApp
router.post('/:phone/messages', async (req, res) => {
  try {
    const { phone } = req.params;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }
    
    // Send the WhatsApp message via Twilio
    await twilioService.sendWhatsAppMessage(phone, message);
    
    // Log it to the chats collection in Firestore
    const chatDoc = await db.collection('chats').add({
      userId: phone,
      message: null, // No incoming message in this event
      reply: message, // Outgoing message from agent
      timestamp: new Date(),
      agentReplied: true
    });
    
    // Update the user's lastMessage timestamp
    await db.collection('users').doc(phone).set({
      phone: phone,
      lastMessage: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    res.json({
      success: true,
      data: {
        id: chatDoc.id + '_bot',
        text: message,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    });
  } catch (error) {
    console.error('Error sending manual message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

module.exports = router;
