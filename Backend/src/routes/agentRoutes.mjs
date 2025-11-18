import { Router } from "express";
import agentController from "../controller/agentController.mjs";
import multer from 'multer';
import { checkRole, ROLES } from '../middleware/roleMiddleware.mjs';
import { authenticateToken } from '../middleware/authMiddleware.mjs';

const upload = multer();

const agentRoutes = Router();

// All routes require authentication
agentRoutes.use(authenticateToken);

// Admin and users can add agents
agentRoutes.post('/addAgent', 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    agentController.addAgent
);

// Admin and users can see all agents
agentRoutes.get("/get-all", 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    agentController.getAllAgents
);

// Admin and users can view agent details
agentRoutes.get("/get-by/:id", 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    agentController.getAgentById
);

// Admin and users can update agent details
agentRoutes.put("/update/:id", 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    agentController.updateAgent
);

// Only admin can delete agents
agentRoutes.delete("/delete/:id", 
    checkRole([ROLES.ADMIN]), 
    agentController.deleteAgent
);

// Admin and users can search agents
agentRoutes.get("/search", 
    checkRole([ROLES.ADMIN, ROLES.USER]), 
    agentController.searchAgents
);

export default agentRoutes;
