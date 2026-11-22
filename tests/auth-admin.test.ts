import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/services/auth.service.js';
import { AppError } from '../src/utils/app-error.js';
import { AdminService } from '../src/services/admin.service.js';
import { User } from '../src/models/user.model.js';
import { SubscriptionService } from '../src/services/subscription.service.js';

describe('Auth & Admin Security Rules', () => {
  afterEach(() => {
    mock.restoreAll();
  });

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

  test('createClient elimina la cuenta si falla la creación del trial', async () => {
    const createdUser: any = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'Client',
      email: 'client@example.com',
      role: 'client',
      isActive: true
    };
    let deleted = false;

    mock.method(User, 'findOne', async () => null);
    mock.method(User, 'create', async () => createdUser);
    mock.method(User, 'deleteOne', async () => { deleted = true; });
    mock.method(SubscriptionService, 'createFreeTrial', async () => {
      throw new AppError(500, 'TRIAL_CREATION_FAILED', 'Trial setup failed');
    });

    await assert.rejects(
      AdminService.createClient({
        name: 'Client',
        email: 'client@example.com',
        password: 'password123'
      }),
      (error: any) => error.code === 'TRIAL_CREATION_FAILED'
    );
    assert.equal(deleted, true);
  });
});