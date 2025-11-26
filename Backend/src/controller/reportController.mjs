import ReportModel from '../models/reportModel.mjs';
import { generateExcelFromData } from '../util/excelGenerator.mjs';

class ReportController {
  static async downloadExcel(req, res) {
    try {
      const filters = req.body || {};

      // Basic validation
      if (!filters.reportType || !filters.startDate || !filters.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: reportType, startDate, endDate'
        });
      }

      // Fetch data from model
      const data = await ReportModel.getReports(filters);

      // Generate Excel workbook
      const workbook = generateExcelFromData(filters.reportType, data);

      // Set response headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filters.reportType}-report.xlsx`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Excel generation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate Excel report.'
      });
    }
  }

  static async generateReport(req, res) {
    try {
  const filters = req.body || {};

      // Basic validation
      if (!filters.reportType || !filters.startDate || !filters.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: reportType, startDate, endDate'
        });
      }

      // Ensure dates are in YYYY-MM-DD format (basic check)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD.'
        });
      }

      // Fetch data from model
      const data = await ReportModel.getReports(filters);

      // Response
      res.json({
        success: true,
        data: data,
        count: data.length,
        message: `Successfully fetched ${data.length} records.`
      });
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate report.'
      });
    }
  }
}

export default ReportController;