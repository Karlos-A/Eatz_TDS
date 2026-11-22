import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword } from '../utils/password.js';
import { assertAllowedFields, parsePagination, readBody, requireObjectId, requireText } from '../utils/request-validation.js';
import { SubscriptionService } from './subscription.service.js';

export class AdminService {
  static async createClient(data: unknown) {
    const body = readBody(data);
    assertAllowedFields(body, ['name', 'email', 'password']);
    
    const name = requireText(body.name, 'Name', 100);
    const email = requireText(body.email, 'Email', 254).toLowerCase();
    const password = body.password;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email is not valid');
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Password must be between 8 and 72 characters');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered');
    }

    const passwordHash = await hashPassword(password);
    const client = await User.create({ 
      name, 
      email, 
      passwordHash, 
      role: 'client', 
      isActive: true 
    });

    try {
      await SubscriptionService.createFreeTrial(client.id);
    } catch (error) {
      try {
        await User.deleteOne({ _id: client._id });
      } catch {
        throw new AppError(
          500,
          'CLIENT_RECOVERY_REQUIRED',
          `Client ${client.id} was created but trial setup failed and automatic rollback failed`
        );
      }
      throw error;
    }
    
    return { 
      id: client.id, 
      name: client.name, 
      email: client.email, 
      role: client.role,
      isActive: client.isActive
    };
  }

  static async setUserActive(userId: string, isActive: boolean) {
    requireObjectId(userId);
    const client = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive } },
      { new: true, runValidators: true }
    ).select('name email role isActive');
    if (!client) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return client;
  }

  static async listClients(filters: { status?: unknown; page?: unknown; limit?: unknown }) {
    const pagination = parsePagination(filters.page, filters.limit);
    const query: Record<string, unknown> = { role: 'client' };

    if (filters.status !== undefined) {
      if (!['active', 'inactive', 'suspended'].includes(String(filters.status))) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Status must be active or inactive');
      }
      query.isActive = filters.status === 'active';
    }

    const [items, total] = await Promise.all([
      User.find(query)
        .select('name email role isActive createdAt')
        .sort('-createdAt')
        .skip(pagination.skip)
        .limit(pagination.limit),
      User.countDocuments(query)
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit, pages: Math.ceil(total / pagination.limit) };
  }
}