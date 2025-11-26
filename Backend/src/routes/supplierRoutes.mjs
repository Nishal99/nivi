import express from 'express';
import supplierController from '../controller/supplierController.mjs';
import {authenticateToken} from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Protect all supplier routes
router.use(authenticateToken);

import { checkRole, ROLES } from '../middleware/roleMiddleware.mjs';

// Get all suppliers (admin and users can view)
router.get('/', 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    supplierController.getAllSuppliers
);

// Search suppliers (admin and users can search)
router.get('/search', 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    supplierController.searchSuppliers
);

// Get supplier by ID (admin and users can view)
router.get('/:id', 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    supplierController.getSupplierById
);

// Create new supplier (admin and users can create)
router.post('/', 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    supplierController.createSupplier
);

// Update supplier (admin and users can update)
router.put('/:id', 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    supplierController.updateSupplier
);

// Delete supplier (only admin can delete)
router.delete('/:id', 
    checkRole([ROLES.ADMIN]), 
    supplierController.deleteSupplier);

// Reassign clients to another supplier and deactivate old supplier
router.post('/reassign-delete',
    checkRole([ROLES.ADMIN]),
    supplierController.reassignAndDeleteSupplier
);

export default router;