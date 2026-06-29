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
import { getRecentChats, getChatMessages, sendChatMessage } from '../services/api';

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

interface ChatsProps {
  onBack?: () => void;
}

const Chats: React.FC<ChatsProps> = ({ onBack }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(() => {
      fetchChats();
    }, 5000); // Poll chat list every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.phone);
    const interval = setInterval(() => {
      fetchMessages(selectedChat.phone);
    }, 3000); // Poll current chat messages every 3 seconds
    return () => clearInterval(interval);
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const recentChats = await getRecentChats();
      setChats(recentChats);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.phone);
    // Mark as read
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const fetchMessages = async (phone: string) => {
    try {
      const chatMessages = await getChatMessages(phone);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const responseMsg = await sendChatMessage(selectedChat.phone, messageText);
      setMessages(prev => [...prev, responseMsg]);
      
      // Update the last message in the chat list
      setChats(prev => prev.map(c => 
        c.phone === selectedChat.phone 
          ? { ...c, lastMessage: messageText, lastMessageTime: 'Just now' } 
          : c
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {onBack && (
              <button 
                onClick={onBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#4f46e5',
                  borderRadius: '0.375rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>Chats</h2>
          </div>
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
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white'
            }}
          >
            {/* Chat Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setSelectedChat(null)}
                  style={{
                    display: window.innerWidth < 768 ? 'block' : 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    color: '#64748b',
                    borderRadius: '0.375rem'
                  }}
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 style={{
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    fontSize: '1.125rem'
                  }}>{selectedChat.customerName}</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    marginTop: '0.125rem'
                  }}>{selectedChat.phone}</p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChat(null)}
                style={{
                  color: '#94a3b8',
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
              gap: '1rem',
              backgroundColor: '#f8fafc'
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
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    ...(message.sender === 'user' ? {
                      background: '#4f46e5',
                      color: 'white',
                      borderBottomRightRadius: '0.25rem'
                    } : {
                      background: 'white',
                      color: '#1e293b',
                      borderBottomLeftRadius: '0.25rem',
                      border: '1px solid #e2e8f0'
                    })
                  }}>
                    <p style={{ fontSize: '0.9375rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{message.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'white'
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
                    backgroundColor: '#f8fafc',
                    fontSize: '1rem',
                    color: '#1e293b',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Smile size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
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
