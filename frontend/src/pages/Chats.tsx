import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  Smile,
  Bot,
  User,
  ArrowLeft,
  MessageSquare,
  X
} from 'lucide-react';

interface Chat {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
  avatar?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

const Chats: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    // Mock data - replace with actual API call
    const mockChats: Chat[] = [
      {
        id: '1',
        customerName: 'John Doe',
        phone: '+1234567890',
        lastMessage: 'Is iPhone 15 still available?',
        lastMessageTime: '2 min ago',
        unreadCount: 2,
        isActive: true,
      },
      {
        id: '2',
        customerName: 'Jane Smith',
        phone: '+0987654321',
        lastMessage: 'Thank you for your help!',
        lastMessageTime: '15 min ago',
        unreadCount: 0,
        isActive: false,
      },
      {
        id: '3',
        customerName: 'Mike Johnson',
        phone: '+1122334455',
        lastMessage: 'What are your payment options?',
        lastMessageTime: '1 hour ago',
        unreadCount: 1,
        isActive: true,
      },
      {
        id: '4',
        customerName: 'Sarah Wilson',
        phone: '+5544332211',
        lastMessage: 'Can I get a discount on bulk order?',
        lastMessageTime: '2 hours ago',
        unreadCount: 0,
        isActive: false,
      },
    ];

    setChats(mockChats);
    setLoading(false);
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
    // Mark as read
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const fetchMessages = async (chatId: string) => {
    // Mock data - replace with actual API call
    const mockMessages: Message[] = [
      {
        id: '1',
        text: 'Hi! I\'m interested in your products',
        sender: 'user',
        timestamp: '10:30 AM',
        status: 'read'
      },
      {
        id: '2',
        text: 'Hello! Welcome to SalesSaarthi AI. How can I help you today?',
        sender: 'bot',
        timestamp: '10:31 AM'
      },
      {
        id: '3',
        text: 'Do you have the latest iPhone models?',
        sender: 'user',
        timestamp: '10:32 AM',
        status: 'read'
      },
      {
        id: '4',
        text: 'Yes! We have iPhone 15 Pro and Pro Max in stock. Would you like to know the pricing?',
        sender: 'bot',
        timestamp: '10:33 AM'
      },
      {
        id: '5',
        text: 'Is the iPhone 15 still available?',
        sender: 'user',
        timestamp: '10:35 AM',
        status: 'delivered'
      },
    ];

    setMessages(mockMessages);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message. Our team will get back to you soon!',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const filteredChats = chats.filter(chat =>
    chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.phone.includes(searchQuery)
  );


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            border: '4px solid #4f46e5',
            borderTop: '4px solid #4338ca',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b' }}>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      {/* Chat List */}
      <div style={{
        width: '20rem',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>Chats</h2>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              bottom: '50%',
              left: 0,
              transform: 'translateY(-50%)',
              paddingLeft: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <Search size={18} style={{ color: '#94a3b8' }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                backgroundColor: 'white',
                fontSize: '1rem',
                color: '#1e293b',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Chat List */}
        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {filteredChats.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: '#f1f5f9',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <MessageSquare size={32} style={{ color: '#94a3b8' }} />
                </div>
                <p style={{ color: '#64748b' }}>No chats yet</p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginTop: '0.25rem'
                }}>Chats will appear here when customers send messages</p>
              </div>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ...(selectedChat?.id === chat.id ? {
                    background: '#e0e7ff',
                    borderLeft: '4px solid #4f46e5'
                  } : {
                    background: '#f8fafc'
                  })
                }}
                onClick={() => handleChatSelect(chat)}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(chat.isActive ? { background: '#10b981' } : { background: '#cbd5e1' })
                  }}>
                    {chat.avatar ? (
                      <img src={chat.avatar} alt={chat.customerName} style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }} />
                    ) : (
                      <User size={24} style={{ color: 'white' }} />
                    )}
                  </div>
                  <div style={{
                    marginLeft: '0.75rem',
                    flex: 1
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div>
                        <h3 style={{
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>{chat.customerName}</h3>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b'
                        }}>{chat.phone}</p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {chat.isActive && (
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            background: '#10b981',
                            borderRadius: '50%'
                          }}></div>
                        )}
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#64748b'
                        }}>
                          {chat.lastMessageTime}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {chat.lastMessage}
                    </div>
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    width: '1.25rem',
                    height: '1.25rem',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {chat.unreadCount}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <AnimatePresence>
        {selectedChat ? (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="flex-1 flex flex-col bg-white"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedChat && (
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 style={{
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>{selectedChat.customerName}</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b'
                  }}>{selectedChat.phone}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChat(null)}
                style={{
                  color: '#94a3b8',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.25rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: message.id === '1' ? 0 : 0.1 }}
                  style={{
                    display: 'flex',
                    ...(message.sender === 'user' ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' })
                  }}
                >
                  <div style={{
                    maxWidth: '20rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    ...(message.sender === 'user' ? {
                      background: '#4f46e5',
                      color: 'white'
                    } : {
                      background: '#f1f5f9',
                      color: '#1e293b'
                    })
                  }}>
                    <p style={{ fontSize: '0.875rem' }}>{message.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    backgroundColor: 'white',
                    fontSize: '1rem',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Smile size={20} className="text-slate-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: window.innerWidth >= 768 ? 'flex' : 'none',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8fafc'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '6rem',
                height: '6rem',
                background: '#f1f5f9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Bot size={48} style={{ color: '#94a3b8' }} />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>Welcome to SalesSaarthi AI</h3>
              <p style={{
                color: '#64748b',
                maxWidth: '28rem',
                margin: '0 auto'
              }}>
                Select a conversation to start chatting with customers. Our AI assistant helps you manage customer inquiries efficiently.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chats;
