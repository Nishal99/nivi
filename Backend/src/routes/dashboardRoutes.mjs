import express from 'express';
import dashboardController from '../controller/dashboardController.mjs';
import { authenticateToken } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Protect all dashboard routes with authentication
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', dashboardController.getStats);

export default router;