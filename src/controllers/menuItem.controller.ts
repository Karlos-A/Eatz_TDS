// MenuItem Controller
// Recibe request de CRUD de items de menú, llama al MenuItemService y devuelve la respuesta al cliente

import type { RequestHandler } from 'express';
import { MenuItemService } from '../services/menuItem.service.js';
import { AppError } from '../utils/app-error.js';

export const createMenuItem: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const menuItem = await MenuItemService.create(request.auth.userId, request.body);
  response.status(201).json({ status: 'success', data: menuItem });
};

export const listMenuItems: RequestHandler = async (request, response) => {
  const restaurantId = request.params.restaurantId as string;
  const availableOnly = request.query.available === 'true';

  const menuItems = await MenuItemService.listByRestaurant(restaurantId, availableOnly);
  response.status(200).json({ status: 'success', data: menuItems });
};

export const updateMenuItem: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const id = request.params.id as string;
  const menuItem = await MenuItemService.update(id, request.auth.userId, request.body);
  response.status(200).json({ status: 'success', data: menuItem });
};

export const deleteMenuItem: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const id = request.params.id as string;
  await MenuItemService.delete(id, request.auth.userId);
  response.status(200).json({ status: 'success', message: 'Menu item deleted successfully' });
};