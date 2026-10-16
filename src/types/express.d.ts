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

//En otras palabras. Solamente se utiliza para agregar la propiedad auth al objeto Request de Express,
// y no afecta a otros tipos de Request que puedan existir en otras bibliotecas o frameworks.