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

export const confirmPayment: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Auth required');
  const sub = await SubscriptionService.confirmPayment(request.auth.userId, request.body);
  response.status(200).json({ status: 'success', data: sub });
};

export const getMySubscription: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Auth required');
  const result = await SubscriptionService.getMySubscription(request.auth.userId);
  response.status(200).json({ status: 'success', data: result });
};

export const cancelPendingRenewal: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Auth required');
  const sub = await SubscriptionService.cancelPendingRenewal(request.auth.userId);
  response.status(200).json({ status: 'success', data: sub });
};

export const listSubscriptions: RequestHandler = async (request, response) => {
  const result = await SubscriptionService.listSubscriptions({
    status: request.query.status,
    plan: request.query.plan,
    page: request.query.page,
    limit: request.query.limit
  });
  response.status(200).json({
    status: 'success',
    data: result.items,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages }
  });
};