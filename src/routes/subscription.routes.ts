import { Router } from 'express';
import {
  cancelPendingRenewal,
  confirmPayment,
  getMySubscription,
  listSubscriptions,
  subscribe,
  verifyExpirations
} from '../controllers/subscription.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const subscriptionRouter = Router();

subscriptionRouter.post('/', authenticate, authorize('client'), subscribe);
subscriptionRouter.post('/confirm-payment', authenticate, authorize('client'), confirmPayment);
subscriptionRouter.get('/me', authenticate, authorize('client'), getMySubscription);
subscriptionRouter.patch('/cancel', authenticate, authorize('client'), cancelPendingRenewal);
subscriptionRouter.get('/', authenticate, authorize('admin'), listSubscriptions);

subscriptionRouter.post('/verify-expirations', authenticate, authorize('admin'), verifyExpirations);