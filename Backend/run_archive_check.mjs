import pool from './src/database/database.mjs';
import { moveExpiredClients } from './src/scheduler/archiveExpiredClients.mjs';

async function listExpired() {
  try {
    const [rows] = await pool.query(
      `SELECT Id, First_Name, Last_Name, Visa_expiry_date FROM client WHERE Visa_expiry_date IS NOT NULL AND Visa_expiry_date < CURDATE()`
    );
    console.log('Expired clients (before archive):', rows);
    return rows;
  } catch (err) {
    console.error('Error querying expired clients:', err);
    throw err;
  }
}

async function listById(id) {
  try {
    const [rows] = await pool.query('SELECT Id, First_Name, Last_Name, Visa_expiry_date FROM client WHERE Id = ?', [id]);
    console.log(`Client ${id} in client table:`, rows);
    const [hist] = await pool.query('SELECT Id, Original_Client_Id, First_Name, Last_Name, Visa_expiry_date, Moved_At FROM client_history WHERE Original_Client_Id = ?', [id]);
    console.log(`Client ${id} in client_history table:`, hist);
  } catch (err) {
    console.error('Error querying by id:', err);
    throw err;
  }
}

async function run() {
  try {
    console.log('Listing expired clients BEFORE archive...');
    await listExpired();

    console.log('\nRunning archive (moveExpiredClients)...');
    const result = await moveExpiredClients();
    console.log('Archive result:', result);

    console.log('\nListing expired clients AFTER archive...');
    await listExpired();

    console.log('\nChecking client id 47 specifically...');
    await listById(47);

    process.exit(0);
  } catch (err) {
    console.error('Run failed:', err);
    process.exit(1);
  }
}

run();
