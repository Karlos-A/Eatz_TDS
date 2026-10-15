// Esta clase extiende el tipo Request de Express para incluir información de autenticación.
import type { Role } from '../models/user.model.js';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role };
    }
  }
}

export {};