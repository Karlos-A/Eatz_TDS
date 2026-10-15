// Order Service
// Manejo de pedidos, incluyendo creación, listado y actualización de estado

import { Order, type OrderStatus } from '../models/order.model.js';
import { MenuItem } from '../models/menuItem.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { AppError } from '../utils/app-error.js';

export class OrderService {
  static async createOrder(customerId: string, data: any) {
    const { restaurantId, items, deliveryAddress, paymentMethod, notes } = data;

    if (!items || !items.length) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Order must contain at least one item');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      throw new AppError(404, 'NOT_FOUND', 'Restaurant not found or inactive');
    }

    let total = 0;
    const processedItems = [];

    // Calcular totales desde el Backend de forma segura
    for (const item of items) {
      const menuItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId });
      
      if (!menuItem) {
        throw new AppError(404, 'NOT_FOUND', `Menu item ${item.menuItemId} not found in this restaurant`);
      }
      if (!menuItem.available) {
        throw new AppError(400, 'ITEM_UNAVAILABLE', `Menu item ${menuItem.name} is currently unavailable`);
      }

      const quantity = Number(item.quantity);
      if (quantity <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Quantity must be at least 1');
      }

      const subtotal = menuItem.price * quantity;
      total += subtotal;

      processedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice: menuItem.price,
        quantity,
        subtotal
      });
    }

    const order = await Order.create({
      customerId,
      restaurantId,
      items: processedItems,
      total,
      deliveryAddress,
      paymentMethod: paymentMethod || 'on_delivery',
      paymentStatus: 'pending',
      notes
    });

    return order;
  }

  static async getCustomerOrders(customerId: string) {
    return await Order.find({ customerId })
      .populate('restaurantId', 'name')
      .sort('-createdAt');
  }

  static async getRestaurantOrders(restaurantId: string, ownerId: string) {
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this restaurant');
    }

    return await Order.find({ restaurantId })
      .populate('customerId', 'name email')
      .sort('-createdAt');
  }

  static async updateOrderStatus(orderId: string, ownerId: string, status: OrderStatus) {
    const order = await Order.findById(orderId).populate('restaurantId');
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');

    const restaurant = order.restaurantId as any;
    if (restaurant.ownerId.toString() !== ownerId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own the restaurant for this order');
    }

    order.status = status;
    await order.save();
    return order;
  }
}