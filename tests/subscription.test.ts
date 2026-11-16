import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SubscriptionService } from '../src/services/subscription.service.js';
import { Subscription } from '../src/models/subscription.model.js';
import { AppError } from '../src/utils/app-error.js';

describe('Subscription Business Rules & Lifecycle', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('SubscriptionService.subscribe rechaza planes inválidos', async () => {
    const ownerId = '507f1f77bcf86cd799439011'; // ObjectId válido simulado
    const invalidPayload = { plan: 'lifetime', paymentMethod: 'card' };

    try {
      await SubscriptionService.subscribe(ownerId, invalidPayload);
      assert.fail('Debería haber lanzado un AppError 400 por plan inválido');
    } catch (error: any) {
      assert.equal(error.status, 400);
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.message, 'Invalid plan selected');
    }
  });

  test('SubscriptionService.subscribe rechaza métodos de pago inválidos', async () => {
    const ownerId = '507f1f77bcf86cd799439011';
    const invalidPayload = { plan: 'monthly', paymentMethod: 'bitcoin' };

    try {
      await SubscriptionService.subscribe(ownerId, invalidPayload);
      assert.fail('Debería haber lanzado un AppError 400 por método de pago inválido');
    } catch (error: any) {
      assert.equal(error.status, 400);
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.message, 'Invalid payment method');
    }
  });

  test('assertActiveSubscription lanza 403 SUBSCRIPTION_EXPIRED si la fecha endDate ya pasó', async () => {
    const ownerId = '507f1f77bcf86cd799439011';
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // Simular que venció hace 5 días

    const mockSub: any = {
      status: 'active',
      endDate: pastDate,
      save: async () => {
        mockSub.status = 'expired';
        return mockSub;
      }
    };

    mock.method(Subscription, 'findOne', async () => mockSub);

    try {
      await SubscriptionService.assertActiveSubscription(ownerId);
      assert.fail('Debería rechazar operaciones comerciales con suscripción expirada');
    } catch (error: any) {
      assert.equal(error.status, 403);
      assert.equal(error.code, 'SUBSCRIPTION_EXPIRED');
    }
  });

  test('createFreeTrial lanza 409 TRIAL_ALREADY_USED si el usuario ya cuenta con un registro', async () => {
    const ownerId = '507f1f77bcf86cd799439011';

    mock.method(Subscription, 'findOne', async () => ({
      ownerId,
      plan: 'free_trial'
    }));

    try {
      await SubscriptionService.createFreeTrial(ownerId);
      assert.fail('Debería rechazar la creación de un segundo trial gratuito');
    } catch (error: any) {
      assert.equal(error.status, 409);
      assert.equal(error.code, 'TRIAL_ALREADY_USED');
    }
  });
});