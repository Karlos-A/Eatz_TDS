import { Router } from 'express';
import { subscribe, verifyExpirations } from '../controllers/subscription.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const subscriptionRouter = Router();

subscriptionRouter.post('/', authenticate, authorize('client'), subscribe);

subscriptionRouter.post('/verify-expirations', authenticate, authorize('admin'), verifyExpirations);