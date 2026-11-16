import type { RequestHandler } from 'express';
import { AdminService } from '../services/admin.service.js';

export const createClient: RequestHandler = async (request, response) => {
  const client = await AdminService.createClient(request.body);
  response.status(201).json({ 
    status: 'success', 
    message: 'Client created successfully',
    data: client 
  });
};