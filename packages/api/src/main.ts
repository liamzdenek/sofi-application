import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.development file in development mode
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({
    path: path.resolve(__dirname, '../.env.development'),
  });
}

import express from 'express';
import cors from 'cors';
import experimentRoutes from './routes/experiments';
import eventRoutes from './routes/events';
import reportRoutes from './routes/reports';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/experiments', experimentRoutes);
app.use('/events', eventRoutes);
app.use('/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send({
    message: 'Experimentation Platform API',
    version: '1.0.0',
    endpoints: {
      experiments: '/experiments',
      events: '/events',
      reports: '/reports',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Start the server
app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});
