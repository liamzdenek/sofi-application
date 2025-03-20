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
import { logger, handleError } from './lib/logger';
import { requestLogger, validateEnvVars } from './lib/middleware';

// Validate required environment variables
const requiredEnvVars = [
  'DYNAMODB_EXPERIMENTS_TABLE',
  'DYNAMODB_EVENTS_TABLE',
  'DYNAMODB_REPORTS_TABLE',
  'S3_REPORTS_BUCKET',
  'AWS_REGION'
];

// In production, also require AWS Batch environment variables
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('BATCH_JOB_QUEUE', 'BATCH_JOB_DEFINITION');
}

try {
  validateEnvVars(requiredEnvVars);
} catch (error) {
  logger.error('Environment validation failed', error as Error);
  // Continue execution in development mode, but exit in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/experiments', experimentRoutes);
app.use('/events', eventRoutes);
app.use('/reports', reportRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check DynamoDB connection by performing a simple operation
    // This is a simple check that doesn't actually query DynamoDB
    // In a real application, you would perform a simple query
    const dynamodbStatus = process.env.DYNAMODB_EXPERIMENTS_TABLE ? 'ok' : 'not configured';
    
    // Check S3 connection
    const s3Status = process.env.S3_REPORTS_BUCKET ? 'ok' : 'not configured';
    
    // Check AWS Batch connection
    const batchStatus = (process.env.BATCH_JOB_QUEUE && process.env.BATCH_JOB_DEFINITION)
      ? 'ok'
      : 'not configured';
    
    res.status(200).json({
      status: 'ok',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        dynamodb: dynamodbStatus,
        s3: s3Status,
        batch: batchStatus
      }
    });
  } catch (error) {
    logger.error('Health check failed', error as Error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: (error as Error).message
    });
  }
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
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body
  });
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
  
  // Re-throw the error after responding to the client
  setTimeout(() => handleError('Unhandled API error', err), 0);
});

// Start the server
app.listen(port, host, () => {
  logger.info(`API server ready at http://${host}:${port}`, {
    host,
    port,
    environment: process.env.NODE_ENV || 'development'
  });
});
