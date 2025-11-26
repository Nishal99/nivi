import { Router } from 'express';
import ReportController from '../controller/reportController.mjs';

const router = Router();

// POST /api/reports/generate - Generate filtered report
router.post('/generate', ReportController.generateReport);

// POST /api/reports/excel - Download report as Excel
router.post('/excel', ReportController.downloadExcel);

export default router;