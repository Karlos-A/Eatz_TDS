import type { RequestHandler } from 'express';
import { SubscriptionService } from '../services/subscription.service.js';
import { AppError } from '../utils/app-error.js';

export const subscribe: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Auth required');
  const sub = await SubscriptionService.subscribe(request.auth.userId, request.body);
  response.status(200).json({ status: 'success', data: sub });
};

export const verifyExpirations: RequestHandler = async (_request, response) => {
  const result = await SubscriptionService.processExpiredSubscriptions();
  response.status(200).json({ status: 'success', data: result });
};