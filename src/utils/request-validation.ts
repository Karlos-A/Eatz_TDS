import { Types } from 'mongoose';
import { AppError } from './app-error.js';

// Valida que el body sea un objeto JSON antes de leer sus propiedades.
export function readBody(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

// Evita que una actualización modifique campos internos no admitidos por el recurso.
export function assertAllowedFields(body: Record<string, unknown>, allowed: readonly string[]): void {
  const unexpected = Object.keys(body).find((key) => !allowed.includes(key));
  if (unexpected) {
    throw new AppError(400, 'VALIDATION_ERROR', `Field '${unexpected}' is not allowed`);
  }
}

// Comparte validaciones estrictas de identificadores, texto y paginación entre servicios.
export function requireObjectId(value: string): void {
  if (!/^[a-f\d]{24}$/i.test(value) || !Types.ObjectId.isValid(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid resource id');
  }
}

export function requireText(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be a non-empty string of at most ${maxLength} characters`);
  }
  return value.trim();
}

export function optionalText(value: unknown, field: string, maxLength = 1000): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be a string of at most ${maxLength} characters`);
  }
  return value.trim();
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(pageValue: unknown, limitValue: unknown): Pagination {
  const page = pageValue === undefined ? 1 : Number(pageValue);
  const limit = limitValue === undefined ? 20 : Number(limitValue);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Page must be positive and limit must be between 1 and 100');
  }
  return { page, limit, skip: (page - 1) * limit };
}

// Trata las búsquedas como texto literal para evitar patrones regex inyectados por el usuario.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
