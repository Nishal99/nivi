import connection from '../database/database.mjs';
import logger from './notificationLogger.mjs';

class NotificationMonitor {
  static async logNotificationAttempt(clientId, notificationType, status, errorMessage = null) {
    try {
      const [result] = await connection.execute(
        'INSERT INTO notification_history (client_id, notification_type, status, error_message) VALUES (?, ?, ?, ?)',
        [clientId, notificationType, status, errorMessage]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Failed to log notification attempt', {
        clientId,
        notificationType,
        status,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async getNotificationStats(startDate = null, endDate = null) {
    try {
      let dateFilter = '';
      const params = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE sent_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const [rows] = await connection.execute(`
        SELECT 
          notification_type,
          status,
          COUNT(*) as count,
          DATE(sent_at) as date
        FROM notification_history
        ${dateFilter}
        GROUP BY notification_type, status, DATE(sent_at)
        ORDER BY sent_at DESC
      `, params);

      return rows;
    } catch (error) {
      logger.error('Failed to get notification stats', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async getClientNotificationHistory(clientId) {
    try {
      const [rows] = await connection.execute(`
        SELECT 
          nh.*,
          c.First_Name,
          c.Last_Name,
          c.Email,
          c.Visa_type,
          c.Visa_expiry_date
        FROM notification_history nh
        JOIN client c ON c.Id = nh.client_id
        WHERE client_id = ?
        ORDER BY sent_at DESC
      `, [clientId]);

      return rows;
    } catch (error) {
      logger.error('Failed to get client notification history', {
        clientId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async getFailedNotifications(startDate = null, endDate = null) {
    try {
      let dateFilter = 'WHERE nh.status = "failed"';
      const params = [];
      
      if (startDate && endDate) {
        dateFilter += ' AND nh.sent_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const [rows] = await connection.execute(`
        SELECT 
          nh.*,
          c.First_Name,
          c.Last_Name,
          c.Email,
          c.Visa_type,
          c.Visa_expiry_date
        FROM notification_history nh
        JOIN client c ON c.Id = nh.client_id
        ${dateFilter}
        ORDER BY nh.sent_at DESC
      `, params);

      return rows;
    } catch (error) {
      logger.error('Failed to get failed notifications', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

export default NotificationMonitor;