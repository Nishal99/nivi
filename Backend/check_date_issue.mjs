import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDateIssue() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'visa_management'
        });

        console.log('🔍 Checking for date calculation issue...\n');
        
        // Get recent client records to see the issue
        const [clients] = await connection.execute(`
            SELECT Id, First_Name, Last_Name, Visa_expiry_date, Visa_extend_for, 
                   DATE_FORMAT(Visa_expiry_date, '%Y-%m-%d') as formatted_expiry
            FROM client 
            ORDER BY Id DESC 
            LIMIT 5
        `);
        
        if (clients.length > 0) {
            console.log('📋 Recent clients:');
            clients.forEach(client => {
                console.log(`ID: ${client.Id}, Name: ${client.First_Name} ${client.Last_Name}`);
                console.log(`  Raw Expiry: ${client.Visa_expiry_date}`);
                console.log(`  Formatted: ${client.formatted_expiry}`);
                console.log(`  Extensions: ${client.Visa_extend_for}`);
                console.log('');
            });
        }

        // Test the exact calculation you described
        console.log('🧮 Testing your specific case:');
        const initialDate = '2025-01-28';
        const extensionMonths = 1;
        
        console.log(`Initial date: ${initialDate}`);
        console.log(`Extension: ${extensionMonths} month(s)`);
        
        const currentExpiry = new Date(initialDate);
        const extensionDays = extensionMonths * 30;
        const newExpiryDate = new Date(currentExpiry.getTime() + (extensionDays * 24 * 60 * 60 * 1000));
        const finalDate = newExpiryDate.toISOString().split('T')[0];
        
        console.log(`Expected result: ${finalDate}`);
        console.log(`Your reported result: 2026-02-26`);
        
        if (finalDate === '2026-02-26') {
            console.log('❌ Calculation matches your issue - there IS a problem!');
        } else {
            console.log('✅ Calculation is correct - issue might be elsewhere');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkDateIssue();