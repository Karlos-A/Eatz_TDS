// Auth Controller
// Recibe request de registro y login, llama al AuthService y devuelve la respuesta al cliente
import type { RequestHandler } from 'express';
import { AuthService } from '../services/auth.service.js';

export const register: RequestHandler = async (request, response) => {
  const result = await AuthService.register(request.body);
  response.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: result
  });
};

export const login: RequestHandler = async (request, response) => {
  const result = await AuthService.login(request.body);
  response.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: result
  });
};

// Nota: No se necesitan try/catch porque Express 5 captura automáticamente los errores y los pasa al middleware de manejo de errores.
// -KA