const { db } = require('../firebase');

/**
 * Get analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAnalytics = async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Get total messages
    const chatsSnapshot = await db.collection('chats').get();
    const totalMessages = chatsSnapshot.size;

    // Get users by stage
    const usersByStage = {
      new: 0,
      interested: 0,
      converted: 0
    };

    usersSnapshot.docs.forEach(doc => {
      const stage = doc.data().stage || 'new';
      usersByStage[stage] = (usersByStage[stage] || 0) + 1;
    });

    // Calculate conversion rate
    const conversionRate = totalUsers > 0 ? (usersByStage.converted / totalUsers) * 100 : 0;

    // Get messages over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentChatsSnapshot = await db
      .collection('chats')
      .where('timestamp', '>=', sevenDaysAgo)
      .orderBy('timestamp', 'asc')
      .get();

    const messagesOverTime = {};
    recentChatsSnapshot.docs.forEach(doc => {
      const date = doc.data().timestamp.toDate().toISOString().split('T')[0];
      messagesOverTime[date] = (messagesOverTime[date] || 0) + 1;
    });

    // Get product count
    const productsSnapshot = await db.collection('products').get();
    const totalProducts = productsSnapshot.size;

    // Get recent chats (last 10)
    const recentChats = await db
      .collection('chats')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const recentChatsData = recentChats.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    const analyticsData = {
      totalUsers,
      totalMessages,
      totalProducts,
      leadsGenerated: usersByStage.interested,
      convertedUsers: usersByStage.converted,
      conversionRate: Math.round(conversionRate * 100) / 100,
      usersByStage,
      messagesOverTime,
      recentChats: recentChatsData
    };

    res.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

/**
 * Get user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserStats = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastMessage: doc.data().lastMessage?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('User Stats Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user stats' });
  }
};

module.exports = { getAnalytics, getUserStats };
