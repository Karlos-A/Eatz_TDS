import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword } from '../utils/password.js';
import { assertAllowedFields, readBody, requireText } from '../utils/request-validation.js';

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

    return { 
      id: client.id, 
      name: client.name, 
      email: client.email, 
      role: client.role,
      isActive: client.isActive
    };
  }
}