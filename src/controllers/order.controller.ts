// Order Controller
// Recibe request de CRUD de órdenes, llama al OrderService y devuelve la respuesta al cliente

import type { RequestHandler } from 'express';
import { OrderService } from '../services/order.service.js';
import { AppError } from '../utils/app-error.js';
import { isOrderStatus } from '../models/order.model.js';

export const createOrder: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const order = await OrderService.createOrder(request.auth.userId, request.body);
  response.status(201).json({ status: 'success', message: 'Order created successfully', data: order });
};

export const getMyOrders: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const result = await OrderService.getCustomerOrders(request.auth.userId, request.query.page, request.query.limit);
  response.status(200).json({
    status: 'success',
    data: result.items,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages }
  });
};

export const getRestaurantOrders: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const restaurantId = request.params.restaurantId as string;
  const result = await OrderService.getRestaurantOrders(
    restaurantId,
    request.auth.userId,
    request.query.page,
    request.query.limit
  );
  response.status(200).json({
    status: 'success',
    data: result.items,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages }
  });
};

export const updateOrderStatus: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const status: unknown = request.body?.status;
  if (!isOrderStatus(status)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Status is invalid');
  }

  const id = request.params.id as string;
  const order = await OrderService.updateOrderStatus(id, request.auth.userId, status);
  response.status(200).json({ status: 'success', data: order });
};

export const cancelMyOrder: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const order = await OrderService.cancelCustomerOrder(request.params.id as string, request.auth.userId);
  response.status(200).json({ status: 'success', data: order });
};