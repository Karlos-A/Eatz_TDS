import { Router } from 'express';
import {
  createRestaurant,
  listRestaurants,
  listMyRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant
} from '../controllers/restaurant.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const restaurantRouter = Router();

restaurantRouter.post('/', authenticate, authorize('client'), createRestaurant);
restaurantRouter.get('/', listRestaurants);
restaurantRouter.get('/mine', authenticate, authorize('client'), listMyRestaurants);
restaurantRouter.get('/:id', getRestaurant);
restaurantRouter.put('/:id', authenticate, authorize('client'), updateRestaurant);
restaurantRouter.delete('/:id', authenticate, authorize('client'), deleteRestaurant);