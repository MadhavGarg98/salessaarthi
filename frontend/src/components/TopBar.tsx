import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';

interface TopBarProps {
  title: string;
}

const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      text: 'New order received',
      time: '2 minutes ago'
    },
    {
      id: 2,
      text: 'Payment confirmed',
      time: '15 minutes ago'
    }
  ];

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        height: '64px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Search Bar */}
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
            placeholder="Search..."
            style={{
              width: '256px',
              paddingLeft: '2.5rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              background: '#f8fafc',
              fontSize: '0.875rem',
              color: '#64748b',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            style={{
              position: 'relative',
              padding: '0.5rem',
              color: '#475569',
              background: 'transparent',
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-0.25rem',
                right: '-0.25rem',
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
                {notifications.length}
              </span>
            )}
          </motion.button>

          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{
                position: 'absolute',
                right: 0,
                top: '0.5rem',
                width: '20rem',
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: '600', color: '#1e293b' }}>Notifications</h3>
              </div>
              <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.875rem', color: '#334155' }}>New order received</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>John Doe placed an order for iPhone 15</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>2 minutes ago</p>
                </div>
                <div style={{ padding: '1rem', background: 'transparent', borderBottom: 'none' }}>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Payment received</p>
                      <p className="text-xs text-slate-500 mt-1">Order #1234 payment confirmed</p>
                      <p className="text-xs text-slate-400 mt-2">15 minutes ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            style={{
              position: 'relative',
              padding: '0.5rem',
              color: '#475569',
              background: 'transparent',
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={20} />
            <span>Profile</span>
          </motion.button>

          {showProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{
                position: 'absolute',
                right: 0,
                top: '0.5rem',
                width: '14rem',
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={20} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', color: '#1e293b' }}>John Doe</h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>john.doe@example.com</p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <LayoutDashboard size={16} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Dashboard</span>
                    </div>
                  </button>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Settings size={16} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Settings</span>
                    </div>
                  </button>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <LogOut size={16} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TopBar;
