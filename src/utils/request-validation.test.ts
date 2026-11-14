import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from './app-error.js';
import { assertAllowedFields, escapeRegex, parsePagination, requireObjectId } from './request-validation.js';

// Verifica límites de paginación que protegen los endpoints de consultas sin límite.
test('parsePagination aplica valores por defecto y rechaza límites inválidos', () => {
  assert.deepEqual(parsePagination(undefined, undefined), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination('3', '10'), { page: 3, limit: 10, skip: 20 });
  assert.throws(() => parsePagination('0', '20'), AppError);
  assert.throws(() => parsePagination('1', '101'), AppError);
});

// Comprueba que identificadores y campos del body se validen antes de consultar MongoDB.
test('request validation rejects malformed identifiers and unexpected fields', () => {
  assert.doesNotThrow(() => requireObjectId('507f1f77bcf86cd799439011'));
  assert.throws(() => requireObjectId('not-an-object-id'), AppError);
  assert.throws(() => assertAllowedFields({ ownerId: 'other-user' }, ['name']), AppError);
});

// Asegura que términos de búsqueda con metacaracteres se interpreten literalmente.
test('escapeRegex neutralizes regex metacharacters', () => {
  const expression = new RegExp(escapeRegex('.*(food)+'));
  assert.equal(expression.test('.*(food)+'), true);
  assert.equal(expression.test('anything food'), false);
});
