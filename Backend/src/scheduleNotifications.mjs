import { checkAndNotifyExpiringVisas } from './config/gmail.mjs';
import { moveExpiredClients } from './scheduler/archiveExpiredClients.mjs';
import cron from 'node-cron';

// Schedule the check to run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily visa expiry tasks...');
  try {
    // First, archive expired clients
    const res = await moveExpiredClients();
    console.log('Archive result:', res);
  } catch (err) {
    console.error('Failed to archive expired clients:', err);
  }

  try {
    // Then send notifications for upcoming expiries
    await checkAndNotifyExpiringVisas();
  } catch (err) {
    console.error('Failed to send expiry notifications:', err);
  }
});

console.log('Visa expiry notification and archiver scheduler started...');