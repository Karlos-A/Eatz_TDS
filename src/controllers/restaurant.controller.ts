
// Restaurant Controller
// recibe request de CRUD de restaurantes, llama al RestaurantService y devuelve la respuesta al cliente
import type { RequestHandler } from 'express';
import { RestaurantService } from '../services/restaurant.service.js';
import { AppError } from '../utils/app-error.js';

export const createRestaurant: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  
  const restaurant = await RestaurantService.create(request.auth.userId, request.body);
  response.status(201).json({ status: 'success', data: restaurant });
};

export const listRestaurants: RequestHandler = async (request, response) => {
  const { category, search, page, limit } = request.query;
  const result = await RestaurantService.list({
    category: typeof category === 'string' ? category : undefined,
    search: typeof search === 'string' ? search : undefined,
    page,
    limit
  });
  response.status(200).json({
    status: 'success',
    data: result.items,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages }
  });
};

export const listMyRestaurants: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await RestaurantService.listByOwner(request.auth.userId, request.query.page, request.query.limit);
  response.status(200).json({
    status: 'success',
    data: result.items,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages }
  });
};

export const getRestaurant: RequestHandler = async (request, response) => {
  const id = request.params.id as string;
  const restaurant = await RestaurantService.getById(id);
  response.status(200).json({ status: 'success', data: restaurant });
};


export const updateRestaurant: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  
  const id = request.params.id as string;
  const restaurant = await RestaurantService.update(id, request.auth.userId, request.body);
  response.status(200).json({ status: 'success', data: restaurant });
};

export const deleteRestaurant: RequestHandler = async (request, response) => {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  
  const id = request.params.id as string;
  await RestaurantService.delete(id, request.auth.userId);
  response.status(200).json({ status: 'success', message: 'Restaurant deactivated successfully' });
};