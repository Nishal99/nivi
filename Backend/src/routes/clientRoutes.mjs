import { Router } from "express";
import clientController from "../controller/clientController.mjs";
import upload from '../middleware/upload.mjs';
import { checkRole, ROLES } from '../middleware/roleMiddleware.mjs';
import { authenticateToken } from '../middleware/authMiddleware.mjs';

const clientRoutes = Router();

// All routes require authentication
clientRoutes.use(authenticateToken);

// Helper to run multer and capture Multer errors so we can return a friendly message
function runMulterSingle(fieldName) {
    const uploader = upload.single(fieldName);
    return (req, res, next) => {
        uploader(req, res, function (err) {
            if (err) {
                // MulterError or other errors
                console.error('Multer error for field', fieldName, err);
                // If it's a MulterError with code 'LIMIT_UNEXPECTED_FILE' or 'LIMIT_PART_COUNT', return a 400
                return res.status(400).json({ message: err.message, code: err.code, field: err.field || fieldName });
            }
            next();
        });
    };
}

// Admin and users can add clients
clientRoutes.post('/addClient', 
    checkRole([ROLES.ADMIN, ROLES.USER]),
    runMulterSingle('image'), 
    clientController.addClient
);

// Admin and agents can view clients, but agents only see their assigned clients
clientRoutes.get('/get-clients', 
    checkRole([ROLES.ADMIN, ROLES.AGENT,ROLES.USER]),
    clientController.getClients
);

// Get archived clients (history)
clientRoutes.get('/get-history',
    checkRole([ROLES.ADMIN, ROLES.USER]),
    clientController.getClientHistory
);

// Only admin can delete clients
clientRoutes.delete('/delete-client/:id',
    checkRole([ROLES.ADMIN]),
    clientController.deleteClient
);

// Admin and users can update clients
clientRoutes.put('/update-client/:id',
    checkRole([ROLES.ADMIN, ROLES.USER]),
    runMulterSingle('image'),
    clientController.updateClient
);

// Manual trigger for archiving expired clients (admin and users)
clientRoutes.post('/archive-expired',
    checkRole([ROLES.ADMIN, ROLES.USER]),
    clientController.archiveExpiredNow
);

// Update history client status (admin and users)
clientRoutes.patch('/update-history-status/:id',
    checkRole([ROLES.ADMIN, ROLES.USER]),
    clientController.updateHistoryStatus
);

export default clientRoutes;