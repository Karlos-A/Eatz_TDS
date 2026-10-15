// Order Controller
// Recibe request de CRUD de órdenes, llama al OrderService y devuelve la respuesta al cliente

import type { RequestHandler } from 'express';
import { OrderService } from '../services/order.service.js';
import { AppError } from '../utils/app-error.js';

export const createOrder: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const order = await OrderService.createOrder(request.auth.userId, request.body);
  response.status(201).json({ status: 'success', message: 'Order created successfully', data: order });
};

export const getMyOrders: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const orders = await OrderService.getCustomerOrders(request.auth.userId);
  response.status(200).json({ status: 'success', data: orders });
};

export const getRestaurantOrders: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const restaurantId = request.params.restaurantId as string;
  const orders = await OrderService.getRestaurantOrders(restaurantId, request.auth.userId);
  response.status(200).json({ status: 'success', data: orders });
};

export const updateOrderStatus: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  if (!request.body.status) throw new AppError(400, 'VALIDATION_ERROR', 'Status is required');

  const id = request.params.id as string;
  const order = await OrderService.updateOrderStatus(id, request.auth.userId, request.body.status);
  response.status(200).json({ status: 'success', data: order });
};