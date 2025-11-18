import connection from '../src/database/database.mjs';
import fs from 'fs/promises';
import path from 'path';

async function setupNotificationTables() {
  try {
    console.log('Starting database setup...');
    
    // Create notification_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notification_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        client_id INT NOT NULL,
        notification_type ENUM('month_before', 'week_before', 'week_after') NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('success', 'failed') NOT NULL,
        error_message TEXT,
        FOREIGN KEY (client_id) REFERENCES client(Id)
      )
    `);
    console.log('Created notification_history table ✅');

    // Create notification_daily_stats table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notification_daily_stats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        total_attempts INT NOT NULL DEFAULT 0,
        successful INT NOT NULL DEFAULT 0,
        failed INT NOT NULL DEFAULT 0,
        skipped INT NOT NULL DEFAULT 0,
        duration_ms INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (date)
      )
    `);
    console.log('Created notification_daily_stats table ✅');

    console.log('Database setup completed successfully! 🎉');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run setup
setupNotificationTables()
  .then(() => {
    console.log('Setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });