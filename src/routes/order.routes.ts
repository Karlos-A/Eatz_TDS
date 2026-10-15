import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getRestaurantOrders,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const orderRouter = Router();

// Rutas para el User
orderRouter.post('/', authenticate, authorize('user'), createOrder);
orderRouter.get('/my-orders', authenticate, authorize('user'), getMyOrders);

// Rutas para el restaurante
orderRouter.get('/restaurant/:restaurantId', authenticate, authorize('client'), getRestaurantOrders);
orderRouter.patch('/:id/status', authenticate, authorize('client'), updateOrderStatus);