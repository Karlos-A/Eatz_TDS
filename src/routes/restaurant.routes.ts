import { Router } from 'express';
import {
  createRestaurant,
  listRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant
} from '../controllers/restaurant.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const restaurantRouter = Router();

restaurantRouter.post('/', authenticate, authorize('client'), createRestaurant);
restaurantRouter.get('/', listRestaurants);
restaurantRouter.get('/:id', getRestaurant);
restaurantRouter.put('/:id', authenticate, authorize('client'), updateRestaurant);
restaurantRouter.delete('/:id', authenticate, authorize('client'), deleteRestaurant);