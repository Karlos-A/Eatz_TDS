// Middleware de autenticación y autorización para Express.js
// Este pide un token de acceso y lo verifica

import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { Role } from '../models/user.model.js';
import { User } from '../models/user.model.js';

export const authenticate: RequestHandler = async (request, response, next) => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required. Provide a Bearer Token.');
  }

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  try {
    const user = await User.findById(payload.sub).select('role isActive');
    if (!user || !user.isActive) {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'This account has been suspended');
    }
    if (user.role !== payload.role) {
      throw new AppError(403, 'FORBIDDEN', 'Token role is no longer valid');
    }
    request.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'INTERNAL_ERROR', 'Could not verify account status');
  }
};

export function authorize(...allowedRoles: Role[]): RequestHandler {
  return (request, response, next) => {
    const auth = request.auth;
    if (!auth || !allowedRoles.includes(auth.role)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
    }
    next();
  };
}