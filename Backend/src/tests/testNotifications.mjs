import { checkAndNotifyExpiringVisas } from '../config/gmail.mjs';
import connection from '../database/database.mjs';
import logger from '../util/notificationLogger.mjs';

async function testNotificationSystem() {
  try {
    logger.info('Starting notification system test');

    // Get current notification counts
    const [beforeCounts] = await connection.execute(`
      SELECT notification_type, COUNT(*) as count 
      FROM notification_history 
      WHERE sent_at >= CURDATE() 
      GROUP BY notification_type
    `);

    // Run notification check
    const results = await checkAndNotifyExpiringVisas();

    // Get updated notification counts
    const [afterCounts] = await connection.execute(`
      SELECT notification_type, COUNT(*) as count 
      FROM notification_history 
      WHERE sent_at >= CURDATE() 
      GROUP BY notification_type
    `);

    // Calculate differences
    const notificationDiff = afterCounts.reduce((acc, curr) => {
      const before = beforeCounts.find(b => b.notification_type === curr.notification_type)?.count || 0;
      acc[curr.notification_type] = curr.count - before;
      return acc;
    }, {});

    logger.info('Notification test results', {
      executionResults: results,
      notificationsSent: notificationDiff,
      startingCounts: beforeCounts,
      finalCounts: afterCounts
    });

    // Verify notification tracking
    const [dailyStats] = await connection.execute(`
      SELECT * FROM notification_daily_stats 
      WHERE date = CURDATE()
    `);

    logger.info('Daily statistics recorded', {
      stats: dailyStats[0]
    });

    return {
      success: true,
      results,
      notificationsSent: notificationDiff,
      dailyStats: dailyStats[0]
    };

  } catch (error) {
    logger.error('Notification system test failed', {
      error: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message
    };
  } finally {
    await connection.end();
  }
}

// Run the test
testNotificationSystem()
  .then(results => {
    console.log('Test completed:', results);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });