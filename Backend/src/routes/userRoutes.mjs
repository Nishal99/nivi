import {  Router } from "express";
import authController from "../controller/authController.mjs";
import { check } from "express-validator";
import { body } from "express-validator";
import connection from "../database/database.mjs";

const userRoutes  = Router();
userRoutes.post('/register',[
    body('fullname').notEmpty().withMessage('Fullname is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').notEmpty().withMessage('Role is required'),
    body('status').notEmpty().withMessage('Status is required')
], authController.register);

userRoutes.post('/login',[
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], authController.login);



export default userRoutes;