import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Importación de Rutas
import { authRouter } from './routes/auth.routes.js';
import { restaurantRouter } from './routes/restaurant.routes.js';
import { menuItemRouter } from './routes/menuItem.routes.js';
import { orderRouter } from './routes/order.routes.js';

// Importación de Middlewares de Error
import { errorHandler, notFound } from './middlewares/error.middleware.js';

export const app = express();

// Middlewares Globales
app.use(helmet()); // Seguridad en headers HTTP
app.use(cors()); // Permite peticiones de otros dominios
app.use(express.json()); // Parsear el body de las peticiones a JSON

// Endpoints de Health Checks
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Eatz API is running perfectly' });
});

// Registro de Rutas
app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/menu-items', menuItemRouter);
app.use('/api/orders', orderRouter);

// Manejo de Rutas Inexistentes y Errores Globales
app.use(notFound);
app.use(errorHandler);