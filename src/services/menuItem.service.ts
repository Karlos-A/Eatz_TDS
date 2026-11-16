// MenuItem Service
// Creación, actualización, eliminación y listado de items de un menú

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

function requirePrice(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Price must be a finite number between 0 and 1000000');
  }
  return Math.round(value * 100) / 100;
}


export class MenuItemService {
  // Valida el artículo y comprueba la propiedad antes de crearlo.
  static async create(ownerId: string, data: unknown) {
    await SubscriptionService.assertActiveSubscription(ownerId);
    const body = readBody(data);
    assertAllowedFields(body, ['restaurantId', 'name', 'description', 'price', 'category']);
    if (typeof body.restaurantId !== 'string') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Restaurant id is required');
    }
    requireObjectId(body.restaurantId);
    const restaurant = await Restaurant.findOne({ _id: body.restaurantId, ownerId, isActive: true });
    if (!restaurant) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this restaurant or it does not exist');
    }

    const menuItem = await MenuItem.create({
      restaurantId: body.restaurantId,
      name: requireText(body.name, 'Name', 120),
      description: optionalText(body.description, 'Description'),
      price: requirePrice(body.price),
      category: optionalText(body.category, 'Category', 80)
    });
    return menuItem;
  }


  static async listByRestaurant(
    restaurantId: string,
    availableOnly: boolean = false,
    pageValue?: unknown,
    limitValue?: unknown
  ) {
    requireObjectId(restaurantId);
    const pagination = parsePagination(pageValue, limitValue);
    const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true }).select('_id');
    if (!restaurant) throw new AppError(404, 'NOT_FOUND', 'Restaurant not found or inactive');
    const query: Record<string, unknown> = { restaurantId };
    if (availableOnly) query.available = true;

    const [items, total] = await Promise.all([
      MenuItem.find(query).sort('category name').skip(pagination.skip).limit(pagination.limit),
      MenuItem.countDocuments(query)
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit, pages: Math.ceil(total / pagination.limit) };
  }

  static async update(id: string, ownerId: string, data: unknown) {
    await SubscriptionService.assertActiveSubscription(ownerId);
    requireObjectId(id);
    const body = readBody(data);
    assertAllowedFields(body, ['name', 'description', 'price', 'category', 'available']);
    if (Object.keys(body).length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'At least one field is required');
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) throw new AppError(404, 'NOT_FOUND', 'Menu item not found');

    const restaurant = await Restaurant.findOne({ _id: menuItem.restaurantId, ownerId, isActive: true });
    if (!restaurant) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this restaurant');
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = requireText(body.name, 'Name', 120);
    if (body.description !== undefined) update.description = optionalText(body.description, 'Description');
    if (body.price !== undefined) update.price = requirePrice(body.price);
    if (body.category !== undefined) update.category = optionalText(body.category, 'Category', 80);
    if (body.available !== undefined) {
      if (typeof body.available !== 'boolean') {
        throw new AppError(400, 'VALIDATION_ERROR', 'Available must be a boolean');
      }
      update.available = body.available;
    }

    return await MenuItem.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  }

  static async delete(id: string, ownerId: string) {
    const menuItem = await MenuItem.findById(id).populate('restaurantId');
    if (!menuItem) throw new AppError(404, 'NOT_FOUND', 'Menu item not found');

    const restaurant = menuItem.restaurantId as any;
    if (restaurant.ownerId.toString() !== ownerId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this restaurant');
    }

    await MenuItem.findByIdAndDelete(id);
    return true;
  }
}