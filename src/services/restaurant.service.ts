// Restaurant Service
// Manejo de restaurantes, incluyendo creación, actualización, eliminación y listado de estos
import { Restaurant } from '../models/restaurant.model.js';
import { AppError } from '../utils/app-error.js';

export class RestaurantService {
  static async create(ownerId: string, data: any) {
    const restaurant = await Restaurant.create({ ...data, ownerId });
    return restaurant;
  }

  static async list(filters: { category?: string; search?: string }) {
    const query: any = { isActive: true };

    if (filters.category) {
      query.category = new RegExp(filters.category, 'i');
    }

    if (filters.search) {
      query.name = new RegExp(filters.search, 'i');
    }

    return await Restaurant.find(query).populate('ownerId', 'name email');
  }

  static async getById(id: string) {
    const restaurant = await Restaurant.findOne({ _id: id, isActive: true });
    if (!restaurant) throw new AppError(404, 'NOT_FOUND', 'Restaurant not found');
    return restaurant;
  }

  static async update(id: string, ownerId: string, data: any) {
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!restaurant) throw new AppError(404, 'NOT_FOUND', 'Restaurant not found or unauthorized');
    return restaurant;
  }

  static async delete(id: string, ownerId: string) {
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: id, ownerId },
      { isActive: false }, // Soft delete
      { new: true }
    );

    if (!restaurant) throw new AppError(404, 'NOT_FOUND', 'Restaurant not found or unauthorized');
    return restaurant;
  }
}