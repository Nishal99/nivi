import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    let connection;
    try {
        // Create connection (using same credentials as database.mjs)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'visa_management',
            multipleStatements: true
        });

        console.log('Connected to database...');

        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_status_to_history.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        console.log('Running migration: add_status_to_history.sql');
        
        // Execute migration
        await connection.query(sql);

        console.log('✓ Migration completed successfully!');
        console.log('✓ Status column added to client_history table');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

runMigration();
