import pool from '../database/database.mjs';

class ReportModel {
  static async getReports(filters) {
    const { reportType, agentName, startDate, endDate, sourceType, visaType, abscondingType } = filters || {};
    try {
      let query = '';
      let params = [];

      if (reportType === 'visa') {
        // Visa report: include client details and agent name, filter by Visa_expiry_date range
        query = `SELECT c.Id as id,
                        c.Agent_id as agent_id,
                        c.First_Name as first_name,
                        c.Last_Name as last_name,
                        c.Image as image,
                        c.uid as uid,
                        c.Passport_No as passport_no,
                        c.Email as email,
                        c.Visa_expiry_date as visa_expiry_date,
                        c.visa_source as source_type,
                        c.Visa_type as visa_type,
                        a.CompanyName as agent_name
                 FROM client c
                 LEFT JOIN agent a ON c.Agent_id = a.Id
                 WHERE c.Visa_expiry_date BETWEEN ? AND ?`;
        params = [startDate, endDate];

        if (agentName) {
          query += ' AND c.Agent_id = ?';
          params.push(agentName);
        }
        if (sourceType) {
          query += ' AND c.visa_source = ?';
          params.push(sourceType);
        }
        if (visaType) {
          query += ' AND c.Visa_type = ?';
          params.push(visaType);
        }
        if (abscondingType) {
          query += ' AND c.Absconding_type = ?';
          params.push(abscondingType);
        }
        query += ' ORDER BY c.Visa_expiry_date DESC';
      } else if (reportType === 'client') {
        // Client report: return all client attributes plus agent name
        query = `SELECT c.*, a.companyName as agent_name FROM client c LEFT JOIN agent a ON c.Agent_id = a.Id WHERE c.Created_At BETWEEN ? AND ?`;
        params = [startDate, endDate];
        if (agentName) {
          query += ' AND c.Agent_id = ?';
          params.push(agentName);
        }
        query += ' ORDER BY c.Created_At DESC';
      } else if (reportType === 'agent') {
        // Agent report: return agent details and their clients (flattened rows; client columns may be null)
        // Select only columns that exist in the client schema to avoid SQL errors
        query = `SELECT a.Id as agent_id, a.CompanyName as companyName, a.Email as email, a.Contact as contact, a.Created_At as agent_created_at,
            c.Id as client_id, c.First_Name as client_first_name, c.Last_Name as client_last_name, c.Image as client_image, c.Passport_No as client_passport_no, c.Email as client_email, c.Visa_type as client_visa_type, c.visa_source as client_visa_source, c.Visa_approved_at as client_visa_approved_at, c.Visa_expiry_date as client_visa_expiry_date, c.Created_At as client_created_at
                 FROM agent a LEFT JOIN client c ON c.Agent_id = a.Id
                 WHERE a.Created_At BETWEEN ? AND ?`;
        params = [startDate, endDate];
        if (agentName) {
          query += ' AND a.Id = ?';
          params.push(agentName);
        }
        query += ' ORDER BY a.Created_At DESC';
      } else {
        throw new Error('Invalid reportType');
      }

      const [rows] = await pool.execute(query, params);
      console.log(rows);
      
      return rows;
    } catch (error) {
      console.error('ReportModel.getReports error:', error);
      throw error;
    }
  }
}

export default ReportModel;