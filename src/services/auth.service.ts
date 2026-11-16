// Auth Service
// Registro y login de usuarios, manejo de contraseñas y tokens JWT
import { User, type Role } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { createAccessToken } from '../utils/jwt.js';
import { assertAllowedFields, readBody, requireObjectId, requireText } from '../utils/request-validation.js';

export class AuthService {
  // Valida el registro y evita aceptar campos que podrían sobrescribir propiedades internas.
  static async register(data: unknown) {
    const body = readBody(data);
    assertAllowedFields(body, ['name', 'email', 'password', 'role']);
    
    const name = requireText(body.name, 'Name', 100);
    const email = requireText(body.email, 'Email', 254).toLowerCase();
    const password = body.password;

    // Validación estricta para bloquear escalamiento de privilegios
    if ('role' in body && body.role !== 'user') {
      throw new AppError(403, 'FORBIDDEN_ROLE_REGISTRATION', 'Registration of roles other than "user" is not allowed');
    }
    const role = 'user'; // Forzado incondicional

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
    const user = await User.create({ name, email, passwordHash, role });
    const token = createAccessToken(user.id, user.role);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
  }

  // Normaliza el email y valida las credenciales antes de comparar el hash almacenado.
  static async login(data: unknown) {
    const body = readBody(data);
    assertAllowedFields(body, ['email', 'password']);
    const email = requireText(body.email, 'Email', 254).toLowerCase();
    const password = body.password;
    if (typeof password !== 'string' || password.length === 0 || password.length > 72) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Password is required');
    }

    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = createAccessToken(user.id, user.role);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
  }

  // Devuelve el perfil público asociado al token sin exponer el hash de contraseña.
  static async getCurrentUser(userId: string) {
    requireObjectId(userId);
    const user = await User.findById(userId).select('name email role createdAt');
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return user;
  }
}