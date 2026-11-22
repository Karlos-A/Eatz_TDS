import type { RequestHandler } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AppError } from '../utils/app-error.js';

export const createClient: RequestHandler = async (request, response) => {
  const client = await AdminService.createClient(request.body);
  response.status(201).json({ 
    status: 'success', 
    message: 'Client created successfully',
    data: client 
  });
};

export const setUserActive: RequestHandler = async (request, response) => {
  const isActive = request.body?.isActive;
  if (typeof isActive !== 'boolean') {
    throw new AppError(400, 'VALIDATION_ERROR', 'isActive must be a boolean');
  }
  const user = await AdminService.setUserActive(request.params.id as string, isActive);
  response.status(200).json({
    status: 'success',
    message: isActive ? 'User activated successfully' : 'User suspended successfully',
    data: user
  });
};

export const listClients: RequestHandler = async (request, response) => {
  const result = await AdminService.listClients({
    status: request.query.status,
    page: request.query.page,
    limit: request.query.limit
  });
  response.status(200).json({
    status: 'success',
    data: result.items,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages }
  });
};