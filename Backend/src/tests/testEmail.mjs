import dotenv from 'dotenv';
import { checkAndNotifyExpiringVisas } from '../config/gmail.mjs';
import connection from '../database/database.mjs';

dotenv.config();

async function testEmailWithSampleData() {
  // We'll insert three clients with clearly identifiable Last_Name values
  const testClients = [
    {
      First_Name: 'Notify',
      Last_Name: 'MonthBefore_Test',
      Email: process.env.USER,
      Passport_No: 'TB-MONTH-001',
      country: 'Testland',
      Visa_type: 'Tourist',
      // Exactly 30 days from now
      Visa_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      initial_period: 6,
      Visa_period: 6,
      Visa_extend_for: 0,
      migrated_at: new Date(),
      Visa_approved_at: new Date()
    },
    {
      First_Name: 'Notify',
      Last_Name: 'WeekBefore_Test',
      Email: process.env.USER,
      Passport_No: 'TB-WEEK-001',
      country: 'Testland',
      Visa_type: 'Business',
      // Exactly 7 days from now
      Visa_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      initial_period: 6,
      Visa_period: 6,
      Visa_extend_for: 0,
      migrated_at: new Date(),
      Visa_approved_at: new Date()
    },
    {
      First_Name: 'Notify',
      Last_Name: 'WeekAfter_Test',
      Email: process.env.USER,
      Passport_No: 'TB-AFTER-001',
      country: 'Testland',
      Visa_type: 'Student',
      // Exactly 7 days ago
      Visa_expiry_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      initial_period: 6,
      Visa_period: 6,
      Visa_extend_for: 0,
      migrated_at: new Date(),
      Visa_approved_at: new Date()
    }
  ];

  try {
    // Insert all test rows
    for (const client of testClients) {
      await connection.execute(`
        INSERT INTO client (
          First_Name, Last_Name, Email, Passport_No, country, Visa_type,
          Visa_expiry_date, initial_period, Visa_period, Visa_extend_for,
          migrated_at, Visa_approved_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        client.First_Name,
        client.Last_Name,
        client.Email,
        client.Passport_No,
        client.country,
        client.Visa_type,
        client.Visa_expiry_date,
        client.initial_period,
        client.Visa_period,
        client.Visa_extend_for,
        client.migrated_at,
        client.Visa_approved_at
      ]);
      console.log(`Inserted test client: ${client.Last_Name}`);
    }

    // Give the DB a short moment (not usually required, but ensures consistency)
    await new Promise((r) => setTimeout(r, 500));

    // Run the notification check (this will call the functions in gmail.mjs and should log send events)
    console.log('Running notification check...');
    await checkAndNotifyExpiringVisas();

    // Clean up test rows
    for (const client of testClients) {
      await connection.execute(`
        DELETE FROM client WHERE First_Name = ? AND Last_Name = ? AND Email = ?
      `, [client.First_Name, client.Last_Name, client.Email]);
      console.log(`Deleted test client: ${client.Last_Name}`);
    }

    console.log('Test finished successfully. Check console logs above for notification send confirmations.');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    // Attempt cleanup if possible
    try {
      for (const client of testClients) {
        await connection.execute(`DELETE FROM client WHERE First_Name = ? AND Last_Name = ? AND Email = ?`, [client.First_Name, client.Last_Name, client.Email]);
      }
    } catch (cleanupErr) {
      console.error('Cleanup failed:', cleanupErr);
    }
    process.exit(1);
  }
}

console.log('Starting email notification multi-scenario test...');
testEmailWithSampleData();
