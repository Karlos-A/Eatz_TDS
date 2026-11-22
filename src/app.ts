import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';

// Importación de Rutas
import { authRouter } from './routes/auth.routes.js';
import { restaurantRouter } from './routes/restaurant.routes.js';
import { menuItemRouter } from './routes/menuItem.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { subscriptionRouter } from './routes/subscription.routes.js';

// Importación de Middlewares de Error
import { errorHandler, notFound } from './middlewares/error.middleware.js';

export const app = express();
const publicDirectory = path.resolve(process.cwd(), 'public');
const pagesDirectory = path.join(publicDirectory, 'pages');

const sendPage = (fileName: string): express.RequestHandler => {
  return (_request, response) => {
    response.sendFile(path.join(pagesDirectory, fileName));
  };
};

// Middlewares Globales
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'style-src': ["'self'", "'unsafe-inline'"],
        'script-src': ["'self'", "'unsafe-inline'"]
      }
    }
  })
); // Seguridad en headers HTTP, permitiendo los recursos inline actuales
app.use(cors()); // Permite peticiones de otros dominios
app.use(express.json()); // Parsear el body de las peticiones a JSON
app.use(express.static(publicDirectory));

// Rutas de las vistas HTML
app.get('/', sendPage('landingPage.html'));
app.get(['/landing', '/landingPage.html'], sendPage('landingPage.html'));
app.get(['/home', '/home.html'], sendPage('home.html'));
app.get(['/login', '/login.html'], sendPage('login.html'));
app.get(['/registro', '/register', '/registro.html'], sendPage('login.html'));
app.get(['/menu', '/menu.html'], sendPage('menu.html'));
app.get(['/restaurants', '/restaurant', '/restaurant.html'], sendPage('restaurant.html'));
app.get(['/restaurant/:id', '/restaurants/:id'], sendPage('restaurant.html'));
app.get(['/items', '/item', '/item.html'], sendPage('item.html'));
app.get(['/item/:id', '/items/:id'], sendPage('item.html'));
app.get(['/cart', '/carrito', '/carrito.html'], sendPage('carrito.html'));
app.get(['/mis-pedidos', '/orders', '/pedidos'], sendPage('mis-pedidos.html'));
app.get(['/perfil'], sendPage('perfil.html'));

// Endpoints de Health Checks
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Eatz API is running perfectly' });
});

// Registro de Rutas
app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/menu-items', menuItemRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/subscriptions', subscriptionRouter);
// Manejo de Rutas Inexistentes y Errores Globales
app.use(notFound);
app.use(errorHandler);