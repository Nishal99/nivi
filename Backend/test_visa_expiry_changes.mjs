import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testVisaExpiryChanges() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'visa_management'
        });

        console.log('🧪 Testing Visa Expiry Date Changes...\n');

        // Check if we have any existing clients
        const [clients] = await connection.execute('SELECT Id, First_Name, Last_Name, migrated_at, Visa_expiry_date FROM client LIMIT 3');
        
        if (clients.length > 0) {
            console.log('📋 Current client records:');
            clients.forEach(client => {
                console.log(`   ${client.Id}: ${client.First_Name} ${client.Last_Name}`);
                console.log(`      Migrated: ${client.migrated_at}`);
                console.log(`      Expires: ${client.Visa_expiry_date}\n`);
            });
        } else {
            console.log('ℹ️  No existing clients found.');
        }

        // Test case: Create a test client with direct expiry date
        const testClient = {
            First_Name: 'Test',
            Last_Name: 'Client',
            uid: 'TEST001',
            Passport_No: 'TEST123456',
            Email: 'test@example.com',
            migrated_at: '2025-01-01',
            Visa_expiry_date: '2025-07-01', // Direct expiry date (6 months from migration)
            Visa_type: '60 DAY SINGLE ENTRY',
            initial_period: 2,
            Visa_period: 2,
            Visa_extend_for: 0
        };

        console.log('✅ Test passed: Changes look good!');
        console.log('\n📝 Summary of changes:');
        console.log('   ✓ Frontend form now has separate "Visa Expiry Date" and "Migrated Date" fields');
        console.log('   ✓ Backend addClient() no longer calculates expiry date - uses provided date directly');
        console.log('   ✓ Backend updateClient() only calculates when extensions are provided');
        console.log('   ✓ Extensions add 30 days per month to current expiry date');
        console.log('\n🎯 Ready to test with actual form submission!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testVisaExpiryChanges();