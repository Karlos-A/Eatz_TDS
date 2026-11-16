import { Router } from 'express';
import { createClient } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const adminRouter = Router();

adminRouter.post('/clients', authenticate, authorize('admin'), createClient);