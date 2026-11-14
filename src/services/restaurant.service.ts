// Restaurant Service
// Manejo de restaurantes, incluyendo creación, actualización, eliminación y listado de estos
import { Restaurant } from '../models/restaurant.model.js';
import { AppError } from '../utils/app-error.js';
import {
  assertAllowedFields,
  escapeRegex,
  optionalText,
  parsePagination,
  readBody,
  requireObjectId,
  requireText
} from '../utils/request-validation.js';

export class RestaurantService {
  static async create(ownerId: string, data: unknown) {
    const body = readBody(data);
    assertAllowedFields(body, ['name', 'description', 'category', 'address', 'phone']);
    const restaurant = await Restaurant.create({
      ownerId,
      name: requireText(body.name, 'Name', 120),
      description: optionalText(body.description, 'Description'),
      category: requireText(body.category, 'Category', 80),
      address: requireText(body.address, 'Address', 300),
      phone: requireText(body.phone, 'Phone', 40)
    });
    return restaurant;
  }

  static async list(filters: { category?: string; search?: string; page?: unknown; limit?: unknown }) {
    const pagination = parsePagination(filters.page, filters.limit);
    const query: Record<string, unknown> = { isActive: true };
    const category = filters.category ? requireText(filters.category, 'Category filter', 80) : undefined;
    const search = filters.search ? requireText(filters.search, 'Search filter', 100) : undefined;

    if (category) {
      query.category = new RegExp(escapeRegex(category), 'i');
    }

    if (search) {
      query.name = new RegExp(escapeRegex(search), 'i');
    }

    const [items, total] = await Promise.all([
      Restaurant.find(query).populate('ownerId', 'name').sort('name').skip(pagination.skip).limit(pagination.limit),
      Restaurant.countDocuments(query)
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit, pages: Math.ceil(total / pagination.limit) };
  }

  static async getById(id: string) {
    const restaurant = await Restaurant.findOne({ _id: id, isActive: true });
    if (!restaurant) throw new AppError(404, 'NOT_FOUND', 'Restaurant not found');
    return restaurant;
  }

static async update(id: string, ownerId: string, data: unknown) {
    requireObjectId(id);
    const body = readBody(data);
    assertAllowedFields(body, ['name', 'description', 'category', 'address', 'phone']);
    if (Object.keys(body).length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'At least one field is required');
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = requireText(body.name, 'Name', 120);
    if (body.description !== undefined) update.description = optionalText(body.description, 'Description');
    if (body.category !== undefined) update.category = requireText(body.category, 'Category', 80);
    if (body.address !== undefined) update.address = requireText(body.address, 'Address', 300);
    if (body.phone !== undefined) update.phone = requireText(body.phone, 'Phone', 40);

    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!restaurant) throw new AppError(404, 'NOT_FOUND', 'Restaurant not found or unauthorized');
    return restaurant;
  }

    static async listByOwner(ownerId: string, pageValue: unknown, limitValue: unknown) {
    const pagination = parsePagination(pageValue, limitValue);
    const filter = { ownerId };
    const [items, total] = await Promise.all([
      Restaurant.find(filter).sort('-createdAt').skip(pagination.skip).limit(pagination.limit),
      Restaurant.countDocuments(filter)
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit, pages: Math.ceil(total / pagination.limit) };
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