import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '../services/api';

interface Order {
  id: string;
  phone: string;
  customerName: string;
  product: string | { name: string; price: number; };
  price: number;
  address: string;
  status: string;
  paymentStatus: string;
  createdAt: any;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const getProductName = (product: string | { name: string; }) => {
    if (!product) return 'Unknown Product';
    if (typeof product === 'string') {
      return product;
    }
    return product.name || 'Unknown Product';
  };

  const getProductPrice = (order: Order) => {
    if (typeof order.product === 'object' && order.product.price) {
      return order.product.price;
    }
    return order.price;
  };

  const formatDate = (createdAt: any) => {
    if (!createdAt) return new Date().toLocaleDateString();
    
    // Handle Firebase Timestamp object with toDate method
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString();
    }
    
    // Handle serialized Firebase Timestamp with _seconds
    if (createdAt._seconds) {
      return new Date(createdAt._seconds * 1000).toLocaleDateString();
    }
    
    // Handle serialized Firebase Timestamp with seconds
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString();
    }
    
    // Handle string dates
    if (typeof createdAt === 'string') {
      return new Date(createdAt).toLocaleDateString();
    }
    
    // Handle number timestamps (milliseconds)
    if (typeof createdAt === 'number') {
      return new Date(createdAt).toLocaleDateString();
    }
    
    // Fallback
    return new Date(createdAt).toLocaleDateString();
  };

  const fetchOrders = async () => {
    try {
      const orders = await getOrders();
      setOrders(orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Paid',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle size={14} />
        };
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Clock size={14} />
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle size={14} />
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: <Clock size={14} />
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (getProductName(order.product)?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (order.phone?.includes(searchQuery) || false);
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && order.status === filter;
  });

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
          <p style={{ color: '#64748b' }}>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>Orders Management</h1>
            <p style={{ color: '#64748b' }}>Track and manage customer orders</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <TrendingUp size={20} className="text-emerald-500" />
            <span className="text-sm font-medium text-slate-700">
              {orders.filter(o => o.status === 'paid').length} of {orders.length} completed
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
              placeholder="Search orders..."
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                ...(filter === 'all' ? {
                  background: '#4f46e5',
                  color: 'white'
                } : {
                  background: '#e2e8f0',
                  color: '#475569'
                })
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                ...(filter === 'pending' ? {
                  background: '#f59e0b',
                  color: 'white'
                } : {
                  background: '#e2e8f0',
                  color: '#475569'
                })
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('paid')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                ...(filter === 'paid' ? {
                  background: '#10b981',
                  color: 'white'
                } : {
                  background: '#e2e8f0',
                  color: '#475569'
                })
              }}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#e2e8f0',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <ShoppingCart size={32} style={{ color: '#94a3b8' }} />
            </div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>No orders found</h3>
            <p style={{
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Orders will appear here when customers make purchases'}
            </p>
          </motion.div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {filteredOrders.map((order, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '0.25rem'
                      }}>{order.customerName}</h4>
                      <p style={{
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>{formatDate(order.createdAt)}</p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {order.status === 'pending' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStatusUpdate(order.id, 'paid')}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            background: '#d1fae5',
                            color: '#059669',
                            transition: 'all 0.2s ease',
                            fontWeight: '500',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <CheckCircle size={16} />
                          <span>Mark Paid</span>
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          background: '#e0e7ff',
                          color: '#4f46e5',
                          transition: 'all 0.2s ease',
                          fontWeight: '500',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <ArrowRight size={16} />
                        <span>View Details</span>
                      </motion.button>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <p style={{
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>Order ID: {order.id}</p>
                    <p style={{
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>Product: {getProductName(order.product)}</p>
                    <p style={{
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>Total: ${getProductPrice(order)}</p>
                    <p style={{
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>Phone: {order.phone}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
