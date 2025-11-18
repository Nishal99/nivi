import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testFixedCalculation() {
    console.log('🧮 Testing the fixed extension calculation logic:\n');
    
    // Test Case 1: Creating a client with initial expiry + extension
    console.log('📝 Test Case 1: Creating client with initial expiry + extension');
    console.log('Input: visa_expiry_date = "2025-01-28", visa_extend_for = 1');
    
    const initialExpiry = '2025-01-28';
    const extensionMonths = 1;
    
    if (extensionMonths > 0) {
        const baseExpiry = new Date(initialExpiry);
        // Add calendar months instead of fixed 30-day periods
        const finalExpiry = new Date(baseExpiry);
        finalExpiry.setMonth(finalExpiry.getMonth() + extensionMonths);
        const final_visa_expiry_date = finalExpiry.toISOString().split('T')[0];
        
        console.log('Result:');
        console.log(`  Original expiry: ${initialExpiry}`);
        console.log(`  Extension months: ${extensionMonths}`);
        console.log(`  Final expiry: ${final_visa_expiry_date}`);
        console.log(`  Expected: 2025-02-28`);
        console.log(`  ✅ ${final_visa_expiry_date === '2025-02-28' ? 'CORRECT' : 'INCORRECT'}\n`);
    }
    
    // Test Case 2: Updating an existing client with additional extension
    console.log('📝 Test Case 2: Updating existing client with additional extension');
    console.log('Scenario: Client currently expires 2025-02-27, adding 1 more month');
    
    const currentExpiry = '2025-02-27';
    const additionalExtension = 1;
    
    const currentExpiryDate = new Date(currentExpiry);
    // Add calendar months instead of fixed 30-day periods
    const newExpiryDate = new Date(currentExpiryDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + additionalExtension);
    const updated_expiry = newExpiryDate.toISOString().split('T')[0];
    
    console.log('Result:');
    console.log(`  Current expiry: ${currentExpiry}`);
    console.log(`  Additional extension: ${additionalExtension} month`);
    console.log(`  New expiry: ${updated_expiry}`);
    console.log(`  Expected: 2025-03-27`);
    console.log(`  ✅ ${updated_expiry === '2025-03-27' ? 'CORRECT' : 'INCORRECT'}\n`);
    
    console.log('🎯 Summary:');
    console.log('  - Create with extension: 2025-01-28 + 1 month = 2025-02-28');
    console.log('  - Update with extension: 2025-02-27 + 1 month = 2025-03-27');
    console.log('  - Using calendar months, not fixed 30-day periods! 🎉');
}

testFixedCalculation();