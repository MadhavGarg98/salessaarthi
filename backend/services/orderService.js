/**
 * Order Service for WhatsApp Sales Assistant
 * Handles order creation, management, and tracking
 */

const { db } = require('../firebase');

/**
 * Create new order
 * @param {Object} orderData - Order details
 * @returns {Promise<string>} Order ID
 */
async function createOrder(orderData) {
  try {
    const orderRef = await db.collection('orders').add({
      phone: orderData.phone,
      customerName: orderData.name,
      product: orderData.product.name,
      productId: orderData.product.id,
      price: orderData.product.price,
      address: orderData.address,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Order created: ${orderRef.id} for ${orderData.phone}`);
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {Object} updates - Status updates
 * @returns {Promise<boolean>} Success status
 */
async function updateOrderStatus(orderId, updates) {
  try {
    await db.collection('orders').doc(orderId).update({
      ...updates,
      updatedAt: new Date()
    });

    console.log(`Order ${orderId} updated:`, updates);
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}

/**
 * Mark order as paid
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
async function markOrderAsPaid(orderId) {
  return await updateOrderStatus(orderId, {
    status: 'paid',
    paymentStatus: 'completed',
    paidAt: new Date()
  });
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order details
 */
async function getOrderById(orderId) {
  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return null;
    }

    return {
      id: orderDoc.id,
      ...orderDoc.data()
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Get orders by phone number
 * @param {string} phone - User phone number
 * @returns {Promise<Array>} User orders
 */
async function getOrdersByPhone(phone) {
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('phone', '==', phone)
      .orderBy('createdAt', 'desc')
      .get();

    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching orders by phone:', error);
    return [];
  }
}

/**
 * Get all orders with pagination
 * @param {number} limit - Maximum orders to fetch
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Orders list
 */
async function getAllOrders(limit = 50, filters = {}) {
  try {
    // Get all orders first without ordering to avoid missing createdAt issues
    let query = db.collection('orders');

    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.paymentStatus) {
      query = query.where('paymentStatus', '==', filters.paymentStatus);
    }
    if (filters.startDate) {
      query = query.where('createdAt', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('createdAt', '<=', filters.endDate);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const ordersSnapshot = await query.get();

    // Sort manually in JavaScript to handle missing createdAt fields
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort orders: those with createdAt come first (newest), then those without come after
    orders.sort((a, b) => {
      // Both have createdAt - sort normally
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toDate() - a.createdAt.toDate();
      }
      // Only a has createdAt - it comes first
      if (a.createdAt && !b.createdAt) {
        return -1;
      }
      // Only b has createdAt - it comes first  
      if (!a.createdAt && b.createdAt) {
        return 1;
      }
      // Neither has createdAt - maintain original order
      return 0;
    });

    return orders;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}

/**
 * Get order statistics
 * @returns {Promise<Object>} Order statistics
 */
async function getOrderStats() {
  try {
    const allOrders = await getAllOrders(1000); // Get more for stats

    const stats = {
      totalOrders: allOrders.length,
      paidOrders: allOrders.filter(order => order.status === 'paid').length,
      pendingOrders: allOrders.filter(order => order.status === 'pending').length,
      totalRevenue: allOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + order.price, 0),
      todayOrders: 0,
      todayRevenue: 0
    };

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allOrders.forEach(order => {
      const orderDate = order.createdAt.toDate();
      if (orderDate >= today) {
        stats.todayOrders++;
        if (order.status === 'paid') {
          stats.todayRevenue += order.price;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error calculating order stats:', error);
    return {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      todayOrders: 0,
      todayRevenue: 0
    };
  }
}

/**
 * Get recent orders (last 24 hours)
 * @returns {Promise<Array>} Recent orders
 */
async function getRecentOrders() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const ordersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', yesterday)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
}

/**
 * Search orders by customer name or phone
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching orders
 */
async function searchOrders(searchTerm) {
  try {
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter orders based on search term
    return orders.filter(order => 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching orders:', error);
    return [];
  }
}

/**
 * Delete order (admin function)
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteOrder(orderId) {
  try {
    await db.collection('orders').doc(orderId).delete();
    console.log(`Order ${orderId} deleted`);
    return true;
  } catch (error) {
    console.error('Error deleting order:', error);
    return false;
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  markOrderAsPaid,
  getOrderById,
  getOrdersByPhone,
  getAllOrders,
  getOrderStats,
  getRecentOrders,
  searchOrders,
  deleteOrder
};
