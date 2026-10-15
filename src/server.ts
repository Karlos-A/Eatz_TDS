import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  try {
    // Conectar a MongoDB
    await connectDatabase();
    
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