// Middleware de manejo de errores
// Atrapa cualquier error que ocurra en los Controladores o Servicios 
// Y formatea la respuesta HTTP para enviar un JSON ordenado.

import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ status: 'error', error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.status).json({ status: 'error', error: { code: error.code, message: error.message } });
    return;
  }

  // Error de clave duplicada en MongoDB (ej. email ya registrado)
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    response.status(409).json({ status: 'error', error: { code: 'DUPLICATE_ENTRY', message: 'Resource already exists' } });
    return;
  }

  // Error de validación de Mongoose
  if (error instanceof Error && error.name === 'ValidationError') {
    response.status(400).json({ status: 'error', error: { code: 'VALIDATION_ERROR', message: error.message } });
    return;
  }

  console.error('[Unhandled Error]:', error);
  response.status(500).json({ status: 'error', error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
};