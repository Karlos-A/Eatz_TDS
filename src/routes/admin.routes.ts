import { Router } from 'express';
import { createClient, listClients, setUserActive } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const adminRouter = Router();

adminRouter.post('/clients', authenticate, authorize('admin'), createClient);
adminRouter.get('/clients', authenticate, authorize('admin'), listClients);
adminRouter.patch('/users/:id/status', authenticate, authorize('admin'), setUserActive);
adminRouter.patch('/clients/:id/status', authenticate, authorize('admin'), setUserActive);