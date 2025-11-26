// import connection from "../database/database.mjs";

// class clientModel {
//     static async createClient(first_name, last_name, image, nic_no, passport_no, visa_approved_at, migrated_at, visa_period, visa_expiry_date, visa_extend_for, visa_type, agent_id) {
//         try {
//             const [result] = await connection.execute(
//                 'INSERT INTO client (first_name, last_name, image, nic_no, passport_no, visa_approved_at, migrated_at, visa_period, visa_expiry_date, visa_extend_for, visa_type, agent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//                 [first_name, last_name, image, nic_no, passport_no, visa_approved_at, migrated_at, visa_period, visa_expiry_date, visa_extend_for, visa_type, agent_id]
//             );

//             //get id of saved results
//             const insertId = await connection.execute(
//                 'SELECT LAST_INSERT_ID() as id'
//             );
//             console.log(insertId);
            
//             return insertId[0][0].id;
            
           
//         } catch (error) {
//             console.error('Error in createClient:', error);
//             throw error;
//         }
//     }

//     static async findByNic(nic) {
//         try {
//             const [rows] = await connection.execute(
//                 'SELECT * FROM client WHERE nic_no = ?',
//                 [nic]
//             );
//             return rows;
//         } catch (error) {
//             console.error('Error in findByNic:', error);
//             throw error;
//         }
//     }

//     static async findById(id) {
//         try {
//             const [rows] = await connection.execute(
//                 'SELECT * FROM client WHERE Id = ?',
//                 [id]
//             );
//             return rows[0];
//         } catch (error) {
//             console.error('Error in findById:', error);
//             throw error;
//         }
//     }
// }

// export default clientModel;