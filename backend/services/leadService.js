const { admin } = require('../firebase');

/**
 * Lead Service
 * Handles lead capture and management
 */

class LeadService {
  constructor() {
    this.leadStages = {
      NEW: 'new',
      INTERESTED: 'interested',
      QUALIFIED: 'qualified',
      CONVERTED: 'converted',
      LOST: 'lost'
    };
  }

  /**
   * Create or update lead
   * @param {Object} db - Firestore database instance
   * @param {string} phone - User phone number
   * @param {Object} leadData - Lead information
   * @returns {Promise<Object>} Lead result
   */
  async createOrUpdateLead(db, phone, leadData) {
    try {
      const leadRef = db.collection('leads').doc(phone);
      const leadDoc = await leadRef.get();

      const lead = {
        phone,
        ...leadData,
        updatedAt: new Date(),
        lastActivity: new Date()
      };

      if (!leadDoc.exists) {
        lead.createdAt = new Date();
        lead.stage = this.leadStages.NEW;
        lead.messageCount = 1;
      } else {
        const existing = leadDoc.data();
        lead.stage = existing.stage || this.leadStages.NEW;
        lead.messageCount = (existing.messageCount || 0) + 1;
        lead.createdAt = existing.createdAt;
      }

      await leadRef.set(lead);
      return { success: true, lead };
    } catch (error) {
      console.error('Error creating/updating lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update lead stage
   * @param {Object} db - Firestore database instance
   * @param {string} phone - User phone number
   * @param {string} stage - New stage
   * @returns {Promise<boolean>} Success status
   */
  async updateLeadStage(db, phone, stage) {
    try {
      const leadRef = db.collection('leads').doc(phone);
      await leadRef.update({
        stage,
        updatedAt: new Date(),
        lastActivity: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating lead stage:', error);
      return false;
    }
  }

  /**
   * Capture product interest
   * @param {Object} db - Firestore database instance
   * @param {string} phone - User phone number
   * @param {Object} product - Product of interest
   * @returns {Promise<Object>} Capture result
   */
  async captureProductInterest(db, phone, product) {
    try {
      const interestRef = db.collection('product_interests').doc();
      await interestRef.set({
        phone,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        capturedAt: new Date(),
        stage: 'interested'
      });

      // Update lead with product interest
      await this.createOrUpdateLead(db, phone, {
        lastProductInterest: product,
        stage: this.leadStages.INTERESTED
      });

      return { success: true, interestId: interestRef.id };
    } catch (error) {
      console.error('Error capturing product interest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Capture order information
   * @param {Object} db - Firestore database instance
   * @param {string} phone - User phone number
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Capture result
   */
  async captureOrder(db, phone, orderData) {
    try {
      const orderRef = db.collection('orders').doc();
      const order = {
        id: orderRef.id,
        phone,
        ...orderData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await orderRef.set(order);

      // Update lead stage to converted
      await this.createOrUpdateLead(db, phone, {
        stage: this.leadStages.CONVERTED,
        lastOrder: order,
        totalOrders: admin.firestore.FieldValue.increment(1)
      });

      return { success: true, order };
    } catch (error) {
      console.error('Error capturing order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get lead by phone
   * @param {Object} db - Firestore database instance
   * @param {string} phone - User phone number
   * @returns {Promise<Object|null>} Lead object or null
   */
  async getLeadByPhone(db, phone) {
    try {
      const leadDoc = await db.collection('leads').doc(phone).get();
      if (leadDoc.exists) {
        return {
          id: leadDoc.id,
          ...leadDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching lead:', error);
      return null;
    }
  }

  /**
   * Get all leads by stage
   * @param {Object} db - Firestore database instance
   * @param {string} stage - Lead stage
   * @returns {Promise<Array>} Leads array
   */
  async getLeadsByStage(db, stage) {
    try {
      const leadsSnapshot = await db.collection('leads')
        .where('stage', '==', stage)
        .orderBy('lastActivity', 'desc')
        .get();

      return leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching leads by stage:', error);
      return [];
    }
  }

  /**
   * Get lead statistics
   * @param {Object} db - Firestore database instance
   * @returns {Promise<Object>} Lead statistics
   */
  async getLeadStats(db) {
    try {
      const leadsSnapshot = await db.collection('leads').get();
      const leads = leadsSnapshot.docs.map(doc => doc.data());

      const stats = {
        total: leads.length,
        new: leads.filter(l => l.stage === this.leadStages.NEW).length,
        interested: leads.filter(l => l.stage === this.leadStages.INTERESTED).length,
        qualified: leads.filter(l => l.stage === this.leadStages.QUALIFIED).length,
        converted: leads.filter(l => l.stage === this.leadStages.CONVERTED).length,
        lost: leads.filter(l => l.stage === this.leadStages.LOST).length
      };

      // Calculate conversion rate
      stats.conversionRate = stats.total > 0 ? (stats.converted / stats.total * 100).toFixed(2) : 0;

      return stats;
    } catch (error) {
      console.error('Error getting lead stats:', error);
      return {
        total: 0,
        new: 0,
        interested: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
        conversionRate: 0
      };
    }
  }

  /**
   * Update lead activity
   * @param {Object} db - Firestore database instance
   * @param {string} phone - User phone number
   * @param {string} activityType - Type of activity
   * @param {Object} activityData - Activity data
   * @returns {Promise<boolean>} Success status
   */
  async updateLeadActivity(db, phone, activityType, activityData) {
    try {
      const activityRef = db.collection('lead_activities').doc();
      await activityRef.set({
        phone,
        activityType,
        activityData,
        timestamp: new Date()
      });

      // Update lead's last activity
      const leadRef = db.collection('leads').doc(phone);
      await leadRef.update({
        lastActivity: new Date(),
        lastActivityType: activityType
      });

      return true;
    } catch (error) {
      console.error('Error updating lead activity:', error);
      return false;
    }
  }

  /**
   * Get hot leads (recent activity, high engagement)
   * @param {Object} db - Firestore database instance
   * @param {number} hours - Hours to look back
   * @returns {Promise<Array>} Hot leads array
   */
  async getHotLeads(db, hours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const leadsSnapshot = await db.collection('leads')
        .where('lastActivity', '>=', cutoffTime)
        .where('stage', 'in', [this.leadStages.INTERESTED, this.leadStages.QUALIFIED])
        .orderBy('lastActivity', 'desc')
        .limit(10)
        .get();

      return leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching hot leads:', error);
      return [];
    }
  }
}

module.exports = new LeadService();
