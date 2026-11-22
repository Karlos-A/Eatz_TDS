import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from '../src/services/order.service.js';
import { Order } from '../src/models/order.model.js';
import { Restaurant } from '../src/models/restaurant.model.js';
import { AppError } from '../src/utils/app-error.js';
import { MenuItem } from '../src/models/menuItem.model.js';
import { SubscriptionService } from '../src/services/subscription.service.js';

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

  test('createOrder con card se guarda pendiente y como pago simulado', async () => {
    const restaurantId = '607f1f77bcf86cd799439012';
    const itemId = '707f1f77bcf86cd799439013';
    mock.method(SubscriptionService, 'assertActiveSubscription', async () => true);
    mock.method(Restaurant, 'findById', async () => ({
      _id: restaurantId,
      ownerId: '507f1f77bcf86cd799439011',
      isActive: true
    }));
    mock.method(MenuItem, 'findOne', async () => ({
      id: itemId,
      name: 'Taco',
      price: 5,
      available: true
    }));
    mock.method(Order, 'create', async (data: any) => ({ id: '807f1f77bcf86cd799439014', ...data }));

    const result = await OrderService.createOrder('507f1f77bcf86cd799439011', {
      restaurantId,
      items: [{ menuItemId: itemId, quantity: 2 }],
      deliveryAddress: 'Main Street',
      paymentMethod: 'card'
    });

    assert.equal(result.paymentStatus, 'pending');
    assert.equal(result.paymentMode, 'simulated');
  });
});