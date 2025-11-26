import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import connection from '../database/database.mjs';
import logger from '../util/notificationLogger.mjs';
import NotificationMonitor from '../util/notificationMonitor.mjs';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER,
    pass: process.env.PASSWORD,
  },
  secure: true,
  port: 465,
});

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid ✅');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

const getVisasForNotification = async () => {
  try {
    logger.info('Starting visa notification check');
    
    // Get clients with visas that need notification, grouped by agent
    // Time periods: 1 month before, 15 days before, 1 week before, on expiry date, and 1 week after expiry
    const [rows] = await connection.execute(`
      WITH ExpiryCategories AS (
        SELECT 
          c.Id,
          c.First_Name,
          c.Last_Name,
          c.Email,
          c.Visa_type,
          c.Visa_expiry_date,
          c.Agent_id,
          a.CompanyName as agent_company,
          a.Email as agent_email,
          DATEDIFF(c.Visa_expiry_date, CURDATE()) as days_until_expiry,
          CASE
            WHEN DATEDIFF(c.Visa_expiry_date, CURDATE()) BETWEEN 29 AND 31 THEN 'month_before'
            WHEN DATEDIFF(c.Visa_expiry_date, CURDATE()) BETWEEN 14 AND 16 THEN '15_days_before'
            WHEN DATEDIFF(c.Visa_expiry_date, CURDATE()) BETWEEN 6 AND 8 THEN 'week_before'
            WHEN DATEDIFF(c.Visa_expiry_date, CURDATE()) BETWEEN -1 AND 1 THEN 'on_expiry_date'
            WHEN DATEDIFF(CURDATE(), c.Visa_expiry_date) BETWEEN 6 AND 8 THEN 'week_after'
            ELSE NULL
          END as notification_type
        FROM client c
        LEFT JOIN agent a ON c.Agent_id = a.Id
        WHERE 
          c.Visa_expiry_date IS NOT NULL
          AND c.Agent_id IS NOT NULL
          AND a.Email IS NOT NULL
      )
      SELECT ec.*
      FROM ExpiryCategories ec
      LEFT JOIN notification_history nh ON 
        ec.Id = nh.client_id 
        AND nh.notification_type = ec.notification_type
        AND nh.sent_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND nh.status = 'success'
      WHERE 
        ec.notification_type IS NOT NULL
        AND nh.id IS NULL
      ORDER BY 
        ec.Agent_id,
        CASE ec.notification_type
          WHEN 'on_expiry_date' THEN 1
          WHEN 'week_before' THEN 2
          WHEN '15_days_before' THEN 3
          WHEN 'month_before' THEN 4
          WHEN 'week_after' THEN 5
        END,
        ec.Visa_expiry_date;
    `);

    // Group clients by agent and notification type
    const agentGroups = {};
    rows.forEach(client => {
      const agentKey = client.Agent_id || 'no_agent';
      if (!agentGroups[agentKey]) {
        agentGroups[agentKey] = {
          agent_id: client.Agent_id,
          agent_email: client.agent_email,
          agent_company: client.agent_company,
          notifications: {}
        };
      }
      
      const notifType = client.notification_type;
      if (!agentGroups[agentKey].notifications[notifType]) {
        agentGroups[agentKey].notifications[notifType] = [];
      }
      
      agentGroups[agentKey].notifications[notifType].push(client);
    });

    const clientsByType = rows.reduce((acc, client) => {
      acc[client.notification_type] = (acc[client.notification_type] || 0) + 1;
      return acc;
    }, {});

    logger.info('Visa notification check results', {
      totalClients: rows.length,
      totalAgents: Object.keys(agentGroups).length,
      breakdown: clientsByType
    });

    return agentGroups;
  } catch (error) {
    logger.error('Failed to fetch visas for notification', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const sendBulkNotificationToAgent = async (agentData) => {
  const startTime = Date.now();
  try {
    const { agent_email, agent_company, notifications } = agentData;
    
    logger.info('Preparing bulk notification for agent', {
      agentEmail: agent_email,
      agentCompany: agent_company,
      notificationTypes: Object.keys(notifications)
    });

    // Build email content with all notification types
    let emailBody = `Dear ${agent_company || 'Agent'},\n\nThis is an automated notification regarding visa expiry alerts for your clients:\n\n`;
    
    const notificationOrder = ['on_expiry_date', 'week_after', 'week_before', '15_days_before', 'month_before'];
    let hasContent = false;
    const clientsToLog = [];

    for (const notifType of notificationOrder) {
      if (!notifications[notifType] || notifications[notifType].length === 0) continue;
      
      hasContent = true;
      const clients = notifications[notifType];
      
      switch (notifType) {
        case 'month_before':
          emailBody += `\n${'='.repeat(70)}\n`;
          emailBody += `📅 EXPIRING IN ONE MONTH (${clients.length} client${clients.length > 1 ? 's' : ''})\n`;
          emailBody += `${'='.repeat(70)}\n`;
          break;
        case '15_days_before':
          emailBody += `\n${'='.repeat(70)}\n`;
          emailBody += `⚠️  EXPIRING IN 15 DAYS (${clients.length} client${clients.length > 1 ? 's' : ''})\n`;
          emailBody += `${'='.repeat(70)}\n`;
          break;
        case 'week_before':
          emailBody += `\n${'='.repeat(70)}\n`;
          emailBody += `🚨 URGENT: EXPIRING IN ONE WEEK (${clients.length} client${clients.length > 1 ? 's' : ''})\n`;
          emailBody += `${'='.repeat(70)}\n`;
          break;
        case 'on_expiry_date':
          emailBody += `\n${'='.repeat(70)}\n`;
          emailBody += `🔴 CRITICAL: EXPIRING TODAY (${clients.length} client${clients.length > 1 ? 's' : ''})\n`;
          emailBody += `${'='.repeat(70)}\n`;
          break;
        case 'week_after':
          emailBody += `\n${'='.repeat(70)}\n`;
          emailBody += `❌ EXPIRED ONE WEEK AGO (${clients.length} client${clients.length > 1 ? 's' : ''})\n`;
          emailBody += `${'='.repeat(70)}\n`;
          break;
      }
      
      clients.forEach((client, index) => {
        const expiryDate = new Date(client.Visa_expiry_date).toLocaleDateString();
        emailBody += `\n${index + 1}. ${client.First_Name} ${client.Last_Name}\n`;
        emailBody += `   - Visa Type: ${client.Visa_type || 'N/A'}\n`;
        emailBody += `   - Expiry Date: ${expiryDate}\n`;
        emailBody += `   - Email: ${client.Email || 'N/A'}\n`;
        emailBody += `   - Days until expiry: ${client.days_until_expiry}\n`;
        
        clientsToLog.push({
          clientId: client.Id,
          notificationType: notifType
        });
      });
    }

    if (!hasContent) {
      logger.warn('No content to send for agent', { agentEmail: agent_email });
      return { success: false, reason: 'no_content' };
    }

    emailBody += `\n${'='.repeat(70)}\n`;
    emailBody += `\nPlease take necessary action for visa renewals.\n\n`;
    emailBody += `Best regards,\nVisa Management System`;

    const subject = `Visa Expiry Notifications - ${Object.keys(notifications).length} Alert Type(s)`;

    logger.notification('Sending bulk notification to agent', {
      agentEmail: agent_email,
      totalClients: clientsToLog.length,
      notificationTypes: Object.keys(notifications)
    });
    
    await transporter.sendMail({
      from: process.env.USER,
      to: agent_email,
      subject: subject,
      text: emailBody,
    });

    // Log successful notification for each client
    for (const { clientId, notificationType } of clientsToLog) {
      await NotificationMonitor.logNotificationAttempt(
        clientId,
        notificationType,
        'success'
      );
    }

    const duration = Date.now() - startTime;
    logger.info('Bulk notification sent successfully', {
      agentEmail: agent_email,
      totalClients: clientsToLog.length,
      duration: `${duration}ms`
    });
    
    return { success: true, clientCount: clientsToLog.length };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to send bulk notification', {
      agentEmail: agentData.agent_email,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    });
    
    // Log failed notification for each client
    for (const notifType of Object.keys(agentData.notifications)) {
      for (const client of agentData.notifications[notifType]) {
        await NotificationMonitor.logNotificationAttempt(
          client.Id,
          notifType,
          'failed',
          error.message
        );
      }
    }
    
    throw error;
  }
};

const checkAndNotifyExpiringVisas = async () => {
  const startTime = Date.now();
  const results = {
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    totalClients: 0,
    agentsNotified: 0,
    byType: {
      month_before: { attempted: 0, succeeded: 0, failed: 0, skipped: 0 },
      '15_days_before': { attempted: 0, succeeded: 0, failed: 0, skipped: 0 },
      week_before: { attempted: 0, succeeded: 0, failed: 0, skipped: 0 },
      on_expiry_date: { attempted: 0, succeeded: 0, failed: 0, skipped: 0 },
      week_after: { attempted: 0, succeeded: 0, failed: 0, skipped: 0 }
    }
  };

  try {
    logger.info('Starting visa expiry notification process (bulk mode)');
    const agentGroups = await getVisasForNotification();
    
    // Process each agent's notifications
    for (const [agentKey, agentData] of Object.entries(agentGroups)) {
      try {
        if (!agentData.agent_email) {
          logger.warn('Skipping agent due to missing email', {
            agentId: agentData.agent_id,
            agentCompany: agentData.agent_company
          });
          results.skippedCount++;
          continue;
        }

        // Count clients by type for this agent
        for (const [notifType, clients] of Object.entries(agentData.notifications)) {
          if (results.byType[notifType]) {
            results.byType[notifType].attempted += clients.length;
          }
          results.totalClients += clients.length;
        }

        const sendResult = await sendBulkNotificationToAgent(agentData);
        
        if (sendResult.success) {
          results.successCount += sendResult.clientCount;
          results.agentsNotified++;
          
          // Update success counts by type
          for (const [notifType, clients] of Object.entries(agentData.notifications)) {
            if (results.byType[notifType]) {
              results.byType[notifType].succeeded += clients.length;
            }
          }
        } else {
          results.skippedCount++;
        }

      } catch (agentError) {
        results.failureCount++;
        
        // Update failure counts by type
        for (const [notifType, clients] of Object.entries(agentData.notifications)) {
          if (results.byType[notifType]) {
            results.byType[notifType].failed += clients.length;
          }
        }
        
        logger.error('Failed to process agent', {
          agentId: agentData.agent_id,
          agentEmail: agentData.agent_email,
          agentCompany: agentData.agent_company,
          error: agentError.message,
          stack: agentError.stack
        });
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      duration: `${duration}ms`,
      totalAgents: Object.keys(agentGroups).length,
      agentsNotified: results.agentsNotified,
      totalClients: results.totalClients,
      results: {
        ...results,
        successRate: results.totalClients > 0 
          ? `${((results.successCount / results.totalClients) * 100).toFixed(1)}%` 
          : '0%'
      }
    };

    logger.info('Visa notification process completed (bulk mode)', summary);

    // Store daily stats
    const statsDate = new Date().toISOString().split('T')[0];
    await connection.execute(
      'INSERT INTO notification_daily_stats (date, total_attempts, successful, failed, skipped, duration_ms) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_attempts = total_attempts + VALUES(total_attempts), successful = successful + VALUES(successful), failed = failed + VALUES(failed), skipped = skipped + VALUES(skipped), duration_ms = VALUES(duration_ms)',
      [statsDate, results.totalClients, results.successCount, results.failureCount, results.skippedCount, duration]
    );

    return summary;

  } catch (error) {
    logger.error('Fatal error in visa notification process', {
      error: error.message,
      stack: error.stack,
      duration: `${Date.now() - startTime}ms`
    });
    throw error;
  }
};

// Export the functions
export { checkAndNotifyExpiringVisas, sendBulkNotificationToAgent };




