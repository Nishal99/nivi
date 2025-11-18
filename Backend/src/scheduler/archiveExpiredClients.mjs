import connection from '../database/database.mjs';

export async function moveExpiredClients() {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // First, check which clients will be archived
    const [expiredClients] = await conn.query(
      `SELECT Id, First_Name, Last_Name, Image, uid, Passport_No, Email, Visa_approved_at, migrated_at, initial_period, Visa_period, Visa_expiry_date, Visa_extend_for, visa_source, Visa_type, Agent_id,supplier_id
       FROM client 
       WHERE Visa_expiry_date IS NOT NULL AND Visa_expiry_date < CURDATE()`
    );
    
    console.log('Found expired clients:', expiredClients);

    // Insert expired clients into history
    // Note: some environments do not have a `Country` column on `client`. Use NULL for Country to keep SQL portable.
    const insertSql = `INSERT INTO client_history (Original_Client_Id, First_Name, Last_Name, Image, uid, Passport_No, Email,  Visa_approved_at, migrated_at, initial_period, Visa_period, Visa_expiry_date, Visa_extend_for, visa_source, Visa_type, Agent_id, supplier_id, Moved_At)
      SELECT Id, First_Name, Last_Name, Image, uid, Passport_No, Email, Visa_approved_at, migrated_at, initial_period, Visa_period, Visa_expiry_date, Visa_extend_for, visa_source, Visa_type, Agent_id, supplier_id, NOW()
      FROM client
      WHERE Visa_expiry_date IS NOT NULL AND Visa_expiry_date < CURDATE()`;

    const [insertResult] = await conn.query(insertSql);

    // Delete archived rows from client table
    const deleteSql = `DELETE FROM client WHERE Visa_expiry_date IS NOT NULL AND Visa_expiry_date < CURDATE()`;
    const [deleteResult] = await conn.query(deleteSql);

    await conn.commit();

    console.log(`Archived ${insertResult.affectedRows} clients to client_history and deleted ${deleteResult.affectedRows} from client`);
    return { inserted: insertResult.affectedRows, deleted: deleteResult.affectedRows };
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (e) { console.error('Rollback error', e); }
    }
    console.error('Error archiving expired clients:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}
