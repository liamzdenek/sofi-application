import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as dotenv from 'dotenv';
import * as path from 'path';
import express from 'express';
import experimentRoutes from './routes/experiments';
import eventRoutes from './routes/events';
import reportRoutes from './routes/reports';
import { logger, handleError } from './lib/logger';
import { requestLogger, validateEnvVars, corsHeaders } from './lib/middleware';
import serverless from 'serverless-http';

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

const app = express();

// Middleware
app.use(corsHeaders); // Apply CORS headers to all responses
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

// Create serverless handler
const serverlessHandler = serverless(app);

// Export the handler function for Lambda
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Log the incoming event
  logger.info('Lambda invocation', { event, context });
  
  try {
    // Handle the request using serverless-http
    return await serverlessHandler(event, context);
  } catch (error) {
    // Log any errors
    logger.error('Lambda handler error', error as Error);
    
    // Return a 500 error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message,
      }),
    };
  }
};
