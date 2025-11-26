import userModel from "../models/userModel.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from 'express-validator';
import { sendPasswordResetEmail } from '../util/emailService.mjs';

dotenv.config();

const authController = {
    register: async (req, res) => {
        console.log(req.body);
        
    try {
        // return validation errors from express-validator if any
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
        }

        const { fullname , username, password, email, role, status } = req.body;

        // defensive checks for required fields
        if (!email || !username || !password || !fullname) {
            return res.status(400).json({ message: 'fullname, username, email and password are required' });
        }

        // check if user exists
        const existingUser = await userModel.findByEmail(email);  
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const existingUsername = await userModel.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // create user
        const createUser = await userModel.createUser(fullname, username, password, email, role, status);

        // generate token
        const token = jwt.sign({ id: createUser }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            token,
            user: { id: createUser, username, email }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error' });
    }
},

    login: async (req, res) => {
    try {
        const { username, password } = req.body;

        //find user
        const user = await userModel.findByUsername(username);
        console.log(user);
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        
        const isMatch = await userModel.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        //generate token with role (set expiry to 1 day)
        const token = jwt.sign(
            { 
                id: user.id,
                role: user.role
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        res.status(200).json({
            token,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role
            }
        });
        
    } catch (err) {
         console.error(err);
        res.status(500).json({ message: 'login server error' });
    }

},

    getProfile: async (req, res) => {
        try {
            const user = await userModel.findById(req.user.id);
            res.json({ user });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            console.log('Processing reset request for email:', email);

            // Find user by email
            const user = await userModel.findByEmail(email);
            console.log('Found user:', user);
            
            // Don't reveal if user exists for security
            if (!user) {
                return res.status(200).json({
                    message: 'If an account exists with this email, you will receive password reset instructions.'
                });
            }

            console.log('Generating reset token for user:', user);
            
            // Generate reset token (1 hour expiry)
            const resetToken = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            console.log('Generated reset token');
            
            // Save reset token to user record
            console.log('Saving reset token for user ID:', user.id);
            await userModel.saveResetToken(user.id, resetToken);
            console.log('Reset token saved successfully');

            // Generate reset link
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            console.log('Reset link generated:', resetLink);
            
            // Send email
            console.log('Attempting to send email to:', email);
            await sendPasswordResetEmail(email, resetLink);
            console.log('Email sent successfully');

            res.status(200).json({
                message: 'If an account exists with this email, you will receive password reset instructions.'
            });
        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                return res.status(400).json({ message: 'Token and password are required' });
            }

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }

            // Find user by email from token
            const user = await userModel.findByEmail(decoded.email);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Verify token matches stored token
            const isValidToken = await userModel.verifyResetToken(user.id, token);
            if (!isValidToken) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }

            // Update password and clear reset token
            await userModel.updatePassword(user.id, password);

            res.status(200).json({ message: 'Password successfully reset' });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await userModel.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateUserStatus: async (req, res) => {
        try {
            const { userId } = req.params;
            const { status } = req.body;

            if (!userId || !status) {
                return res.status(400).json({ message: 'User ID and status are required' });
            }

            const success = await userModel.updateUserStatus(userId, status);
            if (!success) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'User status updated successfully' });
        } catch (error) {
            console.error('Update user status error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

        deleteUser: async (req, res) => {
            try {
                const { userId } = req.params;

                if (!userId) {
                    return res.status(400).json({ message: 'User ID is required' });
                }

                // Prevent admin from deleting themselves
                if (req.user && req.user.id && String(req.user.id) === String(userId)) {
                    return res.status(400).json({ message: 'You cannot delete your own account' });
                }

                const success = await userModel.deleteUser(userId);
                if (!success) {
                    return res.status(404).json({ message: 'User not found' });
                }

                res.json({ message: 'User deleted successfully' });
            } catch (error) {
                console.error('Delete user error:', error);
                res.status(500).json({ message: 'Server error' });
            }
        },

    getUserProfile: async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await userModel.findById(userId);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Remove sensitive information
            delete user.password;
            delete user.reset_token;
            delete user.reset_token_expiry;

            res.json(user);
        } catch (error) {
            console.error('Get user profile error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id; // Get from auth middleware
            const { email, username, fullname } = req.body;

            if (!email || !username || !fullname) {
                return res.status(400).json({ message: 'Email, username, and fullname are required' });
            }

            // Check if email is already taken by another user
            const existingEmail = await userModel.findByEmail(email);
            if (existingEmail && existingEmail.id !== userId) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            // Check if username is already taken by another user
            const existingUsername = await userModel.findByUsername(username);
            if (existingUsername && existingUsername.id !== userId) {
                return res.status(400).json({ message: 'Username already taken' });
            }

            const success = await userModel.updateUserProfile(userId, { email, username, fullname });
            if (!success) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

export default authController;