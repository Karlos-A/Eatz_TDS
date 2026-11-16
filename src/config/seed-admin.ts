import { User } from '../models/user.model.js';
import { hashPassword } from '../utils/password.js';

export async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[Seed] ADMIN_EMAIL o ADMIN_PASSWORD no configurados. Omitiendo creación de Admin.');
    return;
  }

  const existingAdmin = await User.findOne({ email });
  if (!existingAdmin) {
    const passwordHash = await hashPassword(password);
    await User.create({
      name: 'System Administrator',
      email,
      passwordHash,
      role: 'admin',
      isActive: true
    });
    console.log('[Seed] Usuario Administrador creado exitosamente.');
  }
}