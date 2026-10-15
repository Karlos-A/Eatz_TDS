// MenuItem Service
// Creación, actualización, eliminación y listado de items de un menú

import { MenuItem } from '../models/menuItem.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { AppError } from '../utils/app-error.js';

export class MenuItemService {
  static async create(ownerId: string, data: any) {
    // Validar que el restaurante existe y pertenece al cliente
    const restaurant = await Restaurant.findOne({ _id: data.restaurantId, ownerId });
    if (!restaurant) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this restaurant or it does not exist');
    }

    const menuItem = await MenuItem.create(data);
    return menuItem;
  }

  static async listByRestaurant(restaurantId: string, availableOnly: boolean = false) {
    const query: any = { restaurantId };
    if (availableOnly) query.available = true;

    return await MenuItem.find(query);
  }

  static async update(id: string, ownerId: string, data: any) {
    const menuItem = await MenuItem.findById(id).populate('restaurantId');
    if (!menuItem) throw new AppError(404, 'NOT_FOUND', 'Menu item not found');

    // Validar propiedad a través de la referencia poblada
    const restaurant = menuItem.restaurantId as any;
    if (restaurant.ownerId.toString() !== ownerId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this restaurant');
    }

    return await MenuItem.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
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