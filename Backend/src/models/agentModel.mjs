import connection from "../database/database.mjs";


class agentModel {
    static async createAgent(companyName, email, contact, contactPersonName, contactPersonEmail, contactPersonPhone) {
        try {
            console.log('Creating agent with:', companyName, email, contact, contactPersonName, contactPersonEmail, contactPersonPhone);
            const [result] = await connection.query(
                'INSERT INTO agent (companyName, email, contact, contactPersonName, contactPersonEmail, contactPersonPhone) VALUES (?, ?, ?, ?, ?, ?)',
                [companyName, email, contact, contactPersonName, contactPersonEmail, contactPersonPhone]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM agents WHERE Id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }
    static async getAllAgents(){
        try {
            const [results] = await connection.execute(
                `SELECT * FROM agent `
            );
            console.log(results);
            return results;
        } catch (error) {
            console.error('Error in getAllAgents:', error);
            throw error;
        }
    }

    static async updateAgent(id, companyName, email, contact, contactPersonName, contactPersonEmail, contactPersonPhone, status) {
        try {
            // Ensure all values are null if undefined
            const values = [
                companyName ?? null,
                email ?? null,
                contact ?? null,
                contactPersonName ?? null,
                contactPersonEmail ?? null,
                contactPersonPhone ?? null,
                // status may be provided to set active/inactive; keep existing if null
                status ?? null,
                id
            ];

            const [result] = await connection.execute(
                'UPDATE agent SET companyName = ?, email = ?, contact = ?, contactPersonName = ?, contactPersonEmail = ?, contactPersonPhone = ?, status = COALESCE(?, status) WHERE Id = ?',
                values
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Error in updateAgent:', error);
            throw error;
        }
    }

    static async searchAgents(query) {
        try {
            const likeQuery = `%${query}%`;
            console.log('Searching agents with query:', likeQuery);
            
            const [results] = await connection.execute(
                `SELECT 
                    Id,
                    companyName as name,
                    email,
                    contact,
                    contactPersonName,
                    contactPersonEmail,
                    contactPersonPhone
                FROM agent 
                WHERE 
                    status = 'active' 
                    AND (
                        companyName LIKE ? 
                        OR email LIKE ? 
                        OR contactPersonName LIKE ?
                        OR contact LIKE ?
                    )
                LIMIT 10`,
                [likeQuery, likeQuery, likeQuery, likeQuery]
            );
            
            console.log('Search results:', results);
            return results;
        } catch (error) {
            console.error('Error in searchAgents:', error);
            throw error;
        }
    }

    //delete agent 
   static async deleteAgent(id) {
        try {
            // const [agent] = await connection.execute(
            //     `select * from agent where Id = ?`, [id]
            // );


           
            const [result] = await connection.execute(
                'UPDATE agent SET status = "inactive" WHERE Id = ?',
                [id]
            );

           

            // const [addDeleteAgent] = await connection.execute(
            //     `INSERT INTO delete_agent (Id, companyName, email, contact, ConPersonName, ConPersonEmail, ContPersonPhone) VALUES (?,?,?,?,?,?,?)`,
            //    [
            //     agent.Id ?? agent.id ?? agent.id  ,
            //     agent.companyName ?? null,
            //     agent.email ?? null,
            //     agent.contact ?? null,
            //     agent.ContactPersonName ?? null,
            //     agent.ContactPersonEmail ?? null,
            //     agent.ContactPersonPhone ?? null
            //     ]
            // );
            // console.log(addDeleteAgent);
           
            return result.affectedRows;
        } catch (error) {
            console.error('Error in deleteAgent:', error);
            throw error;
        }
}


}

export default agentModel;