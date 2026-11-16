import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { seedAdmin } from './config/seed-admin.js';

async function start(): Promise<void> {
  try {
    // Conectar a MongoDB
    await connectDatabase();
    await seedAdmin(); // Iniciar al administrador
    
    // Levantar el servidor Express
    app.listen(env.port, () => {
      console.log(`Eatz Server is running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start Eatz Server:', error);
    process.exit(1);
  }
}

start();