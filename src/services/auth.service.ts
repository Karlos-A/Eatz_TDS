// Auth Service
// Registro y login de usuarios, manejo de contraseñas y tokens JWT
import { User, type Role } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { createAccessToken } from '../utils/jwt.js';

export class AuthService {
    // Registro de usuario
    // Valida los datos, encripta la contraseña y genera un token de acceso
    static async register(data: any) {
        const { name, email, password, role } = data;

        if (!name || !email || !password) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Name, email, and password are required');
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
        throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered');
        }

        const passwordHash = await hashPassword(password);
        const userRole: Role = role === 'client' ? 'client' : 'user';

        const user = await User.create({ name, email, passwordHash, role: userRole });
        const token = createAccessToken(user.id, user.role);

        return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
        };
    }
  // Login de usuario
  // Valida las credenciales y devuelve un token de acceso si son correctas
  static async login(data: any) {
    const { email, password } = data;

    if (!email || !password) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = createAccessToken(user.id, user.role);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    };
  }
}