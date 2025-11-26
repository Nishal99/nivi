import connection from "../database/database.mjs";

class supplierModel {
    static async getAllSuppliers() {
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM suppliers ORDER BY created_at DESC'
            );
            return rows;
        } catch (error) {
            console.error('Error in getAllSuppliers:', error);
            throw error;
        }
    }

    static async getSupplierById(id) {
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM suppliers WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in getSupplierById:', error);
            throw error;
        }
    }

    static async createSupplier(supplierData) {
        try {
            const { 
                company_name,                       
                email, 
                contact, 
                contact_person, 
                contact_email, 
                contact_number,
                status 
            } = supplierData;

            const [result] = await connection.execute(
                `INSERT INTO suppliers (
                    company_name,                       
                    email, 
                    contact, 
                    contact_person, 
                    contact_email, 
                    contact_number,
                    status 
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    company_name,                       
                    email, 
                    contact, 
                    contact_person, 
                    contact_email, 
                    contact_number,
                    status 
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error in createSupplier:', error);
            throw error;
        }
    }

    static async updateSupplier(id, supplierData) {
        try {
            const { 
               company_name,                       
                email, 
                contact, 
                contact_person, 
                contact_email, 
                contact_number,
                status 
            } = supplierData;

            const [result] = await connection.execute(
                `UPDATE suppliers SET 
                    company_name = ?,                       
                    email = ?, 
                    contact = ?, 
                    contact_person = ?, 
                    contact_email = ?, 
                    contact_number = ?,
                    status = ?
                WHERE id = ?`,
                [
                     company_name,                       
                    email, 
                    contact, 
                    contact_person, 
                    contact_email, 
                    contact_number,
                    status,
                    id
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in updateSupplier:', error);
            throw error;
        }
    }

    static async deleteSupplier(id) {
        try {
            // Soft-delete: mark supplier as inactive to preserve clients and history
            const [result] = await connection.execute(
                'UPDATE suppliers SET status = "inactive" WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in deleteSupplier:', error);
            throw error;
        }
    }

    static async reassignClientsAndDelete(oldSupplierId, newSupplierId) {
        try {
            await connection.query('START TRANSACTION');
            await connection.execute(
                'UPDATE client SET supplier_id = ? WHERE supplier_id = ?',
                [newSupplierId, oldSupplierId]
            );
            // Delete the old supplier row after clients have been reassigned
            await connection.execute(
                'DELETE FROM suppliers WHERE id = ?',
                [oldSupplierId]
            );
            await connection.query('COMMIT');
            return true;
        } catch (error) {
            await connection.query('ROLLBACK');
            console.error('Error in reassignClientsAndDelete (supplier):', error);
            throw error;
        }
    }

    static async searchSuppliers(searchTerm) {
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM suppliers 
                WHERE company_name LIKE ? 
                OR contact_person LIKE ? 
                OR email LIKE ? 
                OR contact LIKE ?`,
                [...Array(4)].map(() => `%${searchTerm}%`)
            );
            return rows;
        } catch (error) {
            console.error('Error in searchSuppliers:', error);
            throw error;
        }
    }
}

export default supplierModel;