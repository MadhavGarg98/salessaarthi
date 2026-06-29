import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Smartphone,
  QrCode,
  ShoppingBag,
  MapPin,
  User,
  Phone,
  ArrowLeft,
  CreditCard
} from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  product: string;
  price: number;
  address: string;
  status: string;
  paymentStatus: string;
}

interface CheckoutProps {
  orderId?: string | null;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Checkout: React.FC<CheckoutProps> = ({ orderId }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [upiId, setUpiId] = useState('salessaarthi@upi');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderAndSettings();
  }, [orderId]);

  const fetchOrderAndSettings = async () => {
    if (!orderId) return;
    try {
      // Fetch Order Details
      const orderRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
      const orderData = await orderRes.json();
      
      if (!orderData.success || !orderData.data) {
        setError('Order not found or has been deleted.');
        setLoading(false);
        return;
      }
      
      const fetchedOrder = orderData.data;
      setOrder(fetchedOrder);

      // If already paid, show success directly
      if (fetchedOrder.paymentStatus === 'completed' || fetchedOrder.paymentStatus === 'paid' || fetchedOrder.status === 'paid') {
        setSuccess(true);
      }

      // Fetch active UPI ID
      const paymentRes = await fetch(`${API_BASE_URL}/api/payment/settings`);
      const paymentData = await paymentRes.json();
      if (paymentData.success && paymentData.data?.upiId) {
        setUpiId(paymentData.data.upiId);
      }
    } catch (err) {
      console.error('Failed to load checkout details:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderId) return;
    setVerifying(true);
    
    // Simulate bank verification delay (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError('Failed to reach server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>Securing checkout session...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        fontFamily: 'Inter, sans-serif',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Checkout Error</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{error}</p>
          <button
            onClick={fetchOrderAndSettings}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        fontFamily: 'Inter, sans-serif',
        padding: '1rem'
      }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{
            backgroundColor: 'white',
            padding: '2.5rem 2rem',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center'
          }}
        >
          <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Payment Successful!</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Thank you for your purchase. We have sent a confirmation receipt and order details to your WhatsApp number.
          </p>
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '1rem',
            padding: '1rem',
            textAlign: 'left',
            marginBottom: '2rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>
              Order ID: #{orderId?.substring(0, 8).toUpperCase()}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#166534' }}>
              Product: {order?.product}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#166534' }}>
              Amount: ₹{order?.price}
            </p>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            You can safely close this window now.
          </p>
        </motion.div>
      </div>
    );
  }

  // Generate UPI Link
  const amount = order?.price || 0;
  const productName = order?.product || 'Product';
  const upiLink = `upi://pay?pa=${upiId}&pn=SalesSaarthi&am=${amount}&tn=Order%20${orderId?.substring(0, 8)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <motion.div 
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '32rem',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          background: 'white',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            backgroundColor: '#e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4f46e5'
          }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>SalesSaarthi Checkout</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Order ID: #{orderId?.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          
          {/* Order Details Card */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>Order Details</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={16} style={{ color: '#94a3b8' }} />
                <span style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>{productName}</span>
              </div>
              <span style={{ fontSize: '1.125rem', color: '#1e293b', fontWeight: 700 }}>₹{amount}</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <User size={14} style={{ color: '#94a3b8', marginTop: '3px' }} />
                <span style={{ fontSize: '0.875rem', color: '#475569' }}>{order?.customerName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Phone size={14} style={{ color: '#94a3b8', marginTop: '3px' }} />
                <span style={{ fontSize: '0.875rem', color: '#475569' }}>{order?.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={14} style={{ color: '#94a3b8', marginTop: '3px' }} />
                <span style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.4' }}>{order?.address}</span>
              </div>
            </div>
          </div>

          {/* UPI Action Container */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {isMobile ? (
              /* Mobile Flow - Direct UPI App Button */
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  Click the button below to pay directly using any UPI app on your phone (GPay, PhonePe, Paytm, etc.).
                </p>
                <a
                  href={upiLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    borderRadius: '1rem',
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                >
                  <Smartphone size={22} />
                  Pay via UPI App
                </a>
              </div>
            ) : (
              /* Desktop Flow - QR Code Display */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <p style={{ color: '#475569', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 1rem' }}>
                  Scan the QR code below to pay
                </p>
                
                <div style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '1rem',
                  backgroundColor: 'white',
                  marginBottom: '1rem'
                }}>
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                  <QrCode size={16} />
                  <span style={{ fontSize: '0.8125rem' }}>Works with GPay, PhonePe, Paytm, BHIM</span>
                </div>
              </div>
            )}
          </div>

          {/* Verification / Simulation Button */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <button
              onClick={handleConfirmPayment}
              disabled={verifying}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.875rem',
                backgroundColor: verifying ? '#e2e8f0' : '#10b981',
                color: verifying ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '1rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: verifying ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => !verifying && (e.currentTarget.style.backgroundColor = '#059669')}
              onMouseLeave={(e) => !verifying && (e.currentTarget.style.backgroundColor = '#10b981')}
            >
              {verifying ? (
                <>
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    border: '2px solid #cbd5e1',
                    borderTop: '2px solid #64748b',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>Verifying payment with bank...</span>
                </>
              ) : (
                <span>I have completed the payment</span>
              )}
            </button>
          </div>

        </div>
      </motion.div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
