import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.mjs';

// Role-based access control middleware
export const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Get token from authMiddleware
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Log role check in development
            if (process.env.NODE_ENV === 'development') {
                console.log('Role Check:', {
                    userRole: user.role,
                    allowedRoles,
                    hasAccess: allowedRoles.includes(user.role)
                });
            }

            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(user.role?.toLowerCase())) {
                return res.status(403).json({ 
                    error: 'Access denied. Insufficient privileges.',
                    details: process.env.NODE_ENV === 'development' ? {
                        userRole: user.role,
                        requiredRoles: allowedRoles
                    } : undefined
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({ error: 'Internal server error during role verification' });
        }
    };
};

// Constants for role types
export const ROLES = {
    ADMIN: 'admin',
    AGENT: 'agent',
    USER: 'user'
};