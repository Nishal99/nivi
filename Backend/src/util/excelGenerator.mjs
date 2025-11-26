// utils/excelGenerator.ts
import ExcelJS from 'exceljs';

/**
 * Generates Excel workbook from report data.
 * @param {string} reportType - Type of report
 * @param {Array<Object>} data - Query results from model
 * @param {string} [visaType] - Optional visa type (for filename/header)
 * @returns {ExcelJS.Workbook} ExcelJS Workbook
 */
export function generateExcelFromData(reportType, data, visaType) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Define headers based on report type
  let headers = [];
  if (reportType === 'client') {
    headers = [
      'ID', 'First Name', 'Last Name', 'UID', 'Passport No', 'Email',
      'Visa Source', 'Visa Type', 'Absconding Type', 'Agent', 'Created At'
    ];
  } else if (reportType === 'agent') {
    headers = [
      'Agent ID', 'Company Name', 'Email', 'Contact',
      'Client First Name', 'Client Last Name', 'Client Passport',
      'Client Email', 'Client Visa Type', 'Client Source', 'Client Created'
    ];
  } else if (reportType === 'visa') {
    headers = [
      'ID', 'Agent', 'First Name', 'Last Name',
      'Source', 'Visa Type', 'Created Date'
    ];
  }

  // Add headers
  worksheet.addRow(headers);
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns = headers.map((header) => ({ width: 15 }));

  // Add data rows
  data.forEach((row) => {
    let rowValues;
    
    if (reportType === 'client') {
      rowValues = [
        row.Id || row.id,
        row.First_Name || row.first_name,
        row.Last_Name || row.last_name,
        row.uid || row.NIC_No,
        row.Passport_No,
        row.Email,
        row.visa_source || row.Visa_source,
        row.Visa_type || row.Visa_Type,
        row.absconding_type || row.Absconding_type,
        row.agent_name || row.companyName,
        row.Created_At || row.created_date
      ];
    } else if (reportType === 'agent') {
      rowValues = [
        row.agent_id || row.Id,
        row.companyName || row.CompanyName,
        row.email || row.Email,
        row.contact || row.Contact,
        row.client_first_name || '',
        row.client_last_name || '',
        row.client_passport_no || '',
        row.client_email || '',
        row.client_visa_type || '',
        row.client_visa_source || '',
        row.client_created_at || ''
      ];
    } else if (reportType === 'visa') {
      rowValues = [
        row.id,
        row.agent_name,
        row.first_name,
        row.last_name,
        row.source_type,
        row.visa_type,
        row.created_date
      ];
    }
    
    worksheet.addRow(rowValues);
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = column.width || 15;
  });

  return workbook;
}