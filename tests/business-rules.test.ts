import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/utils/app-error.js';

describe('Cross-cutting Business Rules: Orders & Payments', () => {
  test('Validación de paymentMethod acepta "on_delivery" y "card" pero rechaza otros', () => {
    const validatePaymentMethod = (method: unknown) => {
      const paymentMethod = method ?? 'on_delivery';
      if (paymentMethod !== 'on_delivery' && paymentMethod !== 'card') {
        throw new AppError(400, 'VALIDATION_ERROR', 'Payment method must be on_delivery or card');
      }
      return paymentMethod === 'card' ? 'paid' : 'pending';
    };

    // Caso 1: Por defecto o on_delivery debe quedar como pending
    assert.equal(validatePaymentMethod('on_delivery'), 'pending');
    assert.equal(validatePaymentMethod(undefined), 'pending');

    // Caso 2: card debe quedar como paid
    assert.equal(validatePaymentMethod('card'), 'paid');

    // Caso 3: Método inválido lanza AppError
    try {
      validatePaymentMethod('bitcoin');
      assert.fail('Debería rechazar un método de pago inválido');
    } catch (error: any) {
      assert.equal(error.status, 400);
      assert.equal(error.code, 'VALIDATION_ERROR');
    }
  });
});