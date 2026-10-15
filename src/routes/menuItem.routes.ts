import { Router } from 'express';
import {
  createMenuItem,
  listMenuItems,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuItem.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const menuItemRouter = Router();

menuItemRouter.post('/', authenticate, authorize('client'), createMenuItem);
menuItemRouter.get('/restaurant/:restaurantId', listMenuItems);
menuItemRouter.put('/:id', authenticate, authorize('client'), updateMenuItem);
menuItemRouter.delete('/:id', authenticate, authorize('client'), deleteMenuItem);