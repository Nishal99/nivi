import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

async function insertTestData() {
    let connection;
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '1234',
            database: process.env.DB_NAME || 'visa_management'
        });

        console.log('Connected to database successfully.');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'test_data_history.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split SQL file into separate statements
        const statements = sql.split(';').filter(stmt => stmt.trim());

        // Execute each statement
        for (let statement of statements) {
            if (statement.trim()) {
                await connection.execute(statement);
                console.log('Executed statement successfully.');
            }
        }

        console.log('Test data inserted successfully!');

    } catch (error) {
        console.error('Error inserting test data:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

insertTestData();