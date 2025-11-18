import { log } from "console";
import connection from "../database/database.mjs";


class clientModel {
    static async createClient(first_name, last_name, image, uid, passport_no, email, visa_approved_at, initial_period, visa_periods, visa_expiry_date, visa_extend_for, visa_source, visa_type, absconding_type, agent_id, supplier_id, comment) {
        try {
            function sanitizeParams(params) {
                return params.map(value => {
                    // Treat undefined or empty string as null for DB integer/nullable columns
                    if (value === undefined || value === '') return null;
                    // Convert numeric strings to numbers
                    if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') return Number(value);
                    return value;
                });
            }

            const [result] = await connection.execute(
                'INSERT INTO client (First_Name, Last_Name, Image, uid, Passport_No, Email, Visa_approved_at, initial_period, Visa_period, Visa_expiry_date, Visa_extend_for, Visa_source, Visa_type, Absconding_type, Agent_id, supplier_id, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                sanitizeParams([first_name, last_name, image, uid, passport_no, email, visa_approved_at, initial_period, visa_periods, visa_expiry_date, visa_extend_for, visa_source, visa_type, absconding_type, agent_id, supplier_id, comment])
            );
            console.log("result ", result);
            
            return result.insertId;
        } catch (error) {
            console.error('Error in createClient:', error);
            throw error;
        }
    }

    static async findByNic(nic) {
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM client WHERE uid = ?',
                [nic]
            );
            return rows;
        } catch (error) {
            console.error('Error in findByNic:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM client WHERE Id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    static async getAllClients(sortBy = null, filterByExpiry = false) {
        try {
            let query = `
                SELECT c.*, 
                       a.CompanyName as AgentCompanyName,
                       s.company_name as SupplierCompanyName 
                FROM client c 
                LEFT JOIN agent a ON c.agent_id = a.Id
                LEFT JOIN suppliers s ON c.supplier_id = s.id`;

            // Add expiry date filter for next 2 months if requested
            if (filterByExpiry) {
                query += `
                    WHERE c.Visa_expiry_date IS NOT NULL 
                    AND c.Visa_expiry_date BETWEEN CURDATE() 
                    AND DATE_ADD(CURDATE(), INTERVAL 2 MONTH)`;
            }

            // Add sorting based on parameter
            switch(sortBy) {
                case 'expiry':
                    query += ` ORDER BY c.Visa_expiry_date ASC`;
                    break;
                case 'agent':
                    query += ` ORDER BY a.CompanyName ASC`;
                    break;
                case 'supplier':
                    query += ` ORDER BY s.company_name ASC`;
                    break;
                case 'uid':
                    query += ` ORDER BY c.uid ASC`;
                    break;
                default:
                    // Default sorting by ID if no sort parameter
                    query += ` ORDER BY c.Id DESC`;
            }

            const [results] = await connection.execute(query);
            return results;
        } catch (error) {
            console.error('Error in getAllClients:', error);
            throw error;
        }
    }

    static async getClientsByAgentId(agentId) {
        try {
            const [results] = await connection.execute(
                `SELECT c.*, a.CompanyName 
                 FROM client c 
                 LEFT JOIN agent a ON c.agent_id = a.Id 
                 WHERE c.agent_id = ?`,
                [agentId]
            );
            return results;
        } catch (error) {
            console.error('Error in getClientsByAgentId:', error);
            throw error;
        }
    }

    static async getClientHistory() {
        try {
            console.log('Fetching client history...');
            const [results] = await connection.execute(
                `SELECT ch.*, a.CompanyName
                 FROM client_history ch
                 LEFT JOIN agent a ON ch.Agent_id = a.Id
                 ORDER BY ch.Moved_At DESC`
            );
            console.log(`Found ${results.length} history records`);
            results.forEach(record => {
                console.log(`History record: ID=${record.Id}, Original_Client_Id=${record.Original_Client_Id}, Name=${record.First_Name} ${record.Last_Name}, Moved_At=${record.Moved_At}`);
            });
            return results;
        } catch (error) {
            console.error('Error in getClientHistory:', error);
            throw error;
        }
    }

           
            // Map request keys to DB column names
            // const validKeys = [
            //     'first_name',
            //     'last_name',
            //     'image',
            //     'nic_no',
            //     'passport_no',
            //     'visa_approved_at',
            //     'migrated_at',
            //     'visa_period',
            //     'visa_expiry_date',
            //     'visa_extend_for',
            //     'visa_type',
            //     'agent_id'
            // ];
            // const filteredData = Object.keys(updateData)
            //     .filter(key => validKeys.includes(key))
            //     .reduce((obj, key) => {
            //         obj[key] = updateData[key];
            //         return obj;
            //     }, {});

            // if (Object.keys(filteredData).length === 0) {
            //     console.log("No valid data to update");
            //     return { affectedRows: 0 };
            // }


    static async updateClient(id, first_name, last_name, image, uid, passport_no, email, visa_approved_at, period, final_visa_expiry_date, visa_extend_for, visa_source, visa_type, absconding_type, agent_id, supplier_id, comment) {
        try {
            console.log(id);

            function sanitize(value) {
                if (value === undefined || value === '') return null;
                // Handle array inputs by taking the first value
                if (Array.isArray(value)) {
                    value = value[0];
                }
                // Convert string numbers to actual numbers
                if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
                    return Number(value);
                }
                return value;
            }
            console.log('Updating client with supplier_id:', supplier_id);
            console.log('Sanitized supplier_id:', sanitize(supplier_id));

            const queryParts = `UPDATE client SET First_Name = ?, Last_Name = ?, Image = ?, uid = ?, Passport_No = ?, Email = ?, Visa_approved_at = ?, Visa_period = ?, Visa_expiry_date = ?, Visa_extend_for = ?, Visa_source = ?, Visa_type = ?, Absconding_type = ?, Agent_id = ?, supplier_id = ?, comment = ? WHERE Id = ?`;
            const values = [
                sanitize(first_name),
                sanitize(last_name),
                sanitize(image),
                sanitize(uid),
                sanitize(passport_no),
                sanitize(email),
                sanitize(visa_approved_at),
                sanitize(period),
                sanitize(final_visa_expiry_date),
                sanitize(visa_extend_for),
                sanitize(visa_source),
                sanitize(visa_type),
                sanitize(absconding_type),
                sanitize(agent_id),
                sanitize(supplier_id),
                sanitize(comment),
                id
            ];

            const [result] = await connection.execute(
                queryParts,
                values
            );
            console.log(result);
            
            return { affectedRows: result.affectedRows };
        } catch (error) {
            console.error('Error in updateClient:', error);
            throw error;
        }

    }


        static async deleteClient(id) {
            try {
                const [result] = await connection.execute(
                    'DELETE FROM client WHERE Id = ?',
                    [id]
                );
                return { affectedRows: result.affectedRows };
            } catch (error) {
                console.error('Error in deleteClient:', error);
                throw error;
            }
        }

        static async updateHistoryStatus(id, status) {
            try {
                const validStatuses = ['archived', 'closed', 'status changed', 'absconded'];
                if (!validStatuses.includes(status)) {
                    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
                }

                const [result] = await connection.execute(
                    'UPDATE client_history SET Status = ? WHERE Id = ?',
                    [status, id]
                );
                return { affectedRows: result.affectedRows };
            } catch (error) {
                console.error('Error in updateHistoryStatus:', error);
                throw error;
            }
        }
}

  

export default clientModel;

