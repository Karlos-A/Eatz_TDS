// Order Service
// Manejo de pedidos, incluyendo creación, listado y actualización de estado

import { Order, type OrderStatus } from '../models/order.model.js';
import { MenuItem } from '../models/menuItem.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { AppError } from '../utils/app-error.js';
import {
  assertAllowedFields,
  optionalText,
  parsePagination,
  readBody,
  requireObjectId,
  requireText
} from '../utils/request-validation.js';
import { SubscriptionService } from './subscription.service.js';

export class OrderService {
  // Valida cantidades y datos del pedido; el precio siempre se obtiene del catálogo.
  static async createOrder(customerId: string, data: unknown) {
    const body = readBody(data);
    assertAllowedFields(body, ['restaurantId', 'items', 'deliveryAddress', 'paymentMethod', 'notes']);
    if (typeof body.restaurantId !== 'string') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Restaurant id is required');
    }
    requireObjectId(body.restaurantId);
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Order must contain between 1 and 50 items');
    }
    const deliveryAddress = requireText(body.deliveryAddress, 'Delivery address', 300);
    const notes = optionalText(body.notes, 'Notes');
    const paymentMethod = body.paymentMethod ?? 'on_delivery';
    if (paymentMethod !== 'on_delivery' && paymentMethod !== 'card') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Payment method must be on_delivery or card');
    }

    const restaurant = await Restaurant.findById(body.restaurantId);
    if (!restaurant || !restaurant.isActive) {
      throw new AppError(404, 'NOT_FOUND', 'Restaurant not found or inactive');
    }
    
    let totalCents = 0;
    const processedItems: Array<{
      menuItemId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }> = [];
    
    await SubscriptionService.assertActiveSubscription(restaurant.ownerId.toString());
    
    for (const rawItem of body.items) {
      const item = readBody(rawItem);
      assertAllowedFields(item, ['menuItemId', 'quantity']);
      if (typeof item.menuItemId !== 'string') {
        throw new AppError(400, 'VALIDATION_ERROR', 'Menu item id is required');
      }
      requireObjectId(item.menuItemId);
      if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Quantity must be an integer between 1 and 99');
      }
      const quantity = item.quantity;
      const menuItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId: body.restaurantId });
      
      if (!menuItem) {
        throw new AppError(404, 'NOT_FOUND', `Menu item ${item.menuItemId} not found in this restaurant`);
      }
      if (!menuItem.available) {
        throw new AppError(400, 'ITEM_UNAVAILABLE', `Menu item ${menuItem.name} is currently unavailable`);
      }

      const unitPriceCents = Math.round(menuItem.price * 100);
      const subtotalCents = unitPriceCents * quantity;
      totalCents += subtotalCents;

      processedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice: unitPriceCents / 100,
        quantity,
        subtotal: subtotalCents / 100
      });
    }

    const paymentStatus = 'pending';
    const paymentMode = paymentMethod === 'card' ? 'simulated' : 'none';

    const order = await Order.create({
      customerId,
      restaurantId: body.restaurantId,
      items: processedItems,
      total: totalCents / 100,
      deliveryAddress,
      paymentMethod,
      paymentStatus,
      paymentMode,
      notes
    });

    return order;
  }

  // Pagina el historial del cliente sin cambiar el arreglo devuelto en data.
  static async getCustomerOrders(customerId: string, pageValue: unknown, limitValue: unknown) {
    const pagination = parsePagination(pageValue, limitValue);
    const filter = { customerId };
    const [items, total] = await Promise.all([
      Order.find(filter).populate('restaurantId', 'name').sort('-createdAt').skip(pagination.skip).limit(pagination.limit),
      Order.countDocuments(filter)
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit, pages: Math.ceil(total / pagination.limit) };
  }

  // Comprueba la propiedad del restaurante y pagina la bandeja del dueño.
  static async getRestaurantOrders(restaurantId: string, ownerId: string, pageValue: unknown, limitValue: unknown) {
    requireObjectId(restaurantId);
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this restaurant');
    }

    const pagination = parsePagination(pageValue, limitValue);
    const filter = { restaurantId };
    const [items, total] = await Promise.all([
      Order.find(filter).populate('customerId', 'name').sort('-createdAt').skip(pagination.skip).limit(pagination.limit),
      Order.countDocuments(filter)
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit, pages: Math.ceil(total / pagination.limit) };
  }

  // Restringe al dueño a transiciones válidas para evitar retrocesos o reaperturas de pedidos.
  static async updateOrderStatus(orderId: string, ownerId: string, status: OrderStatus) {
    requireObjectId(orderId);
    const order = await Order.findById(orderId);
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');

    const restaurant = await Restaurant.findOne({ _id: order.restaurantId, ownerId });
    if (!restaurant) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own the restaurant for this order');
    }

    const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered'],
      delivered: [],
      cancelled: []
    };
    if (!transitions[order.status].includes(status)) {
      throw new AppError(409, 'INVALID_ORDER_TRANSITION', `Cannot move an order from ${order.status} to ${status}`);
    }

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, status: order.status },
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      throw new AppError(409, 'ORDER_CONCURRENT_UPDATE', 'The order status changed concurrently');
    }
    return updated;
  }

  // Solo permite al cliente cancelar su propio pedido mientras el restaurante aún no lo prepara.
  static async cancelCustomerOrder(orderId: string, customerId: string) {
    requireObjectId(orderId);
    const order = await Order.findOne({ _id: orderId, customerId });
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    if (order.status !== 'pending') {
      throw new AppError(409, 'INVALID_ORDER_TRANSITION', 'Only pending orders can be cancelled by the customer');
    }
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, customerId, status: 'pending' },
      { $set: { status: 'cancelled' } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      throw new AppError(409, 'ORDER_CONCURRENT_UPDATE', 'The order status changed concurrently');
    }
    return updated;
  }
}