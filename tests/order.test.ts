import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from '../src/services/order.service.js';
import { Order } from '../src/models/order.model.js';
import { Restaurant } from '../src/models/restaurant.model.js';
import { AppError } from '../src/utils/app-error.js';

describe('Order State Transitions & Business Rules', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('updateOrderStatus rechaza transiciones inválidas (ej. pending a delivered directamente)', async () => {
    const orderId = '507f1f77bcf86cd799439011';
    const ownerId = '507f1f77bcf86cd799439011';

    mock.method(Order, 'findById', async () => ({
      _id: orderId,
      restaurantId: '607f1f77bcf86cd799439012',
      status: 'pending'
    }));

    mock.method(Restaurant, 'findOne', async () => ({
      _id: '607f1f77bcf86cd799439012',
      ownerId
    }));

    try {
      await OrderService.updateOrderStatus(orderId, ownerId, 'delivered');
      assert.fail('Debería haber rechazado la transición de estado');
    } catch (error: any) {
      assert.equal(error.status, 409);
      assert.equal(error.code, 'INVALID_ORDER_TRANSITION');
    }
  });

  test('cancelCustomerOrder solo permite cancelar pedidos mientras están en estado pending', async () => {
    const orderId = '507f1f77bcf86cd799439011';
    const customerId = '507f1f77bcf86cd799439011';

    mock.method(Order, 'findOne', async () => ({
      _id: orderId,
      customerId,
      status: 'preparing'
    }));

    try {
      await OrderService.cancelCustomerOrder(orderId, customerId);
      assert.fail('Debería rechazar la cancelación si el pedido ya se está preparando en cocina');
    } catch (error: any) {
      assert.equal(error.status, 409);
      assert.equal(error.code, 'INVALID_ORDER_TRANSITION');
      assert.match(error.message, /pending orders can be cancelled/);
    }
  });
});