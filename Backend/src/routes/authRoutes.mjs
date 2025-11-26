import express from 'express';
import authController from '../controller/authController.mjs';
import { body } from 'express-validator';
import {authenticateToken} from '../middleware/authMiddleware.mjs';
import { checkRole } from '../middleware/roleMiddleware.mjs';

const router = express.Router();

// Login route
router.post('/login', authController.login);

// Register route with validation
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('username').trim().not().isEmpty(),
    body('fullname').trim().not().isEmpty()
], authController.register);

// Get user profile route (protected)
router.get('/profile', authenticateToken, authController.getProfile);

// Get specific user profile
router.get('/profile/:userId', authenticateToken, authController.getUserProfile);

// Update user profile
router.put('/profile', [
    authenticateToken,
    body('email').isEmail().normalizeEmail(),
    body('username').trim().not().isEmpty(),
    body('fullname').trim().not().isEmpty()
], authController.updateProfile);

// Get all users (admin only)
router.get('/users', authenticateToken, checkRole(['admin']), authController.getAllUsers);

// Update user status (admin only)
router.patch('/users/:userId/status', [
    authenticateToken,
    checkRole(['admin']),
    body('status').isIn(['active', 'inactive'])
], authController.updateUserStatus);

// Delete a user (admin only)
router.delete('/users/:userId', authenticateToken, checkRole(['admin']), authController.deleteUser);

// Password reset routes
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], authController.forgotPassword);

router.post('/reset-password', [
    body('token').not().isEmpty(),
    body('password').isLength({ min: 6 })
], authController.resetPassword);

export default router;