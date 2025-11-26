import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.mjs';
import env from 'dotenv';
env.config();

export const authenticateToken = async (req, res, next) => {
    try {
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return next();
        }

        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'No authorization header',
                code: 'AUTH_HEADER_MISSING'
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Invalid authorization format. Use Bearer token',
                code: 'INVALID_AUTH_FORMAT'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ 
                message: 'User not found or inactive',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({ 
                message: 'Account is not active',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error.name, error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            console.error('Authentication error:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            res.status(401).json({ 
                message: 'Authentication failed',
                code: 'AUTH_FAILED',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
    }
};