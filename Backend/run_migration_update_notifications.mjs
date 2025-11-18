import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'visa_management',
      multipleStatements: true
    });

    const files = [
      path.join(__dirname, 'migrations', 'add_notification_tables.sql'),
      path.join(__dirname, 'migrations', 'update_notification_types.sql'),
    ];

    for (const file of files) {
      const sql = await fs.readFile(file, 'utf8');
      console.log('Running migration:', path.basename(file));
      await connection.query(sql);
      console.log('✓ Done:', path.basename(file));
    }

    console.log('All notification migrations completed successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
    if (err.sqlMessage) console.error('SQL:', err.sqlMessage);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

run();
