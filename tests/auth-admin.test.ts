import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/services/auth.service.js';
import { AppError } from '../src/utils/app-error.js';

describe('Auth & Admin Security Rules', () => {
  test('AuthService.register rechaza intentos de registrar un rol de admin', async () => {
    const maliciousPayload = {
      name: 'Hacker',
      email: 'hacker@example.com',
      password: 'password123',
      role: 'admin' // Intento de escalamiento de privilegios
    };

    try {
      await AuthService.register(maliciousPayload);
      assert.fail('Debería haber lanzado un AppError 403');
    } catch (error: any) {
      assert.ok(error instanceof AppError);
      assert.equal(error.status, 403);
      assert.equal(error.code, 'FORBIDDEN_ROLE_REGISTRATION');
    }
  });

  test('AuthService.register rechaza intentos de registrar un rol de client', async () => {
    const maliciousPayload = {
      name: 'Fake Restaurant',
      email: 'fake@restaurant.com',
      password: 'password123',
      role: 'client'
    };

    try {
      await AuthService.register(maliciousPayload);
      assert.fail('Debería haber lanzado un AppError 403');
    } catch (error: any) {
      assert.equal(error.status, 403);
      assert.equal(error.code, 'FORBIDDEN_ROLE_REGISTRATION');
    }
  });
});