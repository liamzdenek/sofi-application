import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Middleware to add CORS headers to all responses
 */
export const corsHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add CORS headers to all responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  next();
};

/**
 * Middleware to log incoming requests and outgoing responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log request details
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Record start time
  const startTime = Date.now();

  // Capture the original end method
  const originalEnd = res.end;

  // Override the end method to log response details
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Log response details
    logger.info('Outgoing response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    // Call the original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

/**
 * Validate required environment variables
 * @param requiredVars Array of required environment variable names
 * @throws Error if any required variables are missing
 */
export const validateEnvVars = (requiredVars: string[]): void => {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMessage, new Error(errorMessage));
    throw new Error(errorMessage);
  }
};

/**
 * Middleware to validate request body against a Joi schema
 * @param schema Joi schema to validate against
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details.map((detail: any) => detail.message).join(', ');
      
      logger.warn('Request validation failed', {
        method: req.method,
        path: req.path,
        error: errorMessage,
      });

      res.status(400).json({
        message: 'Validation error',
        error: errorMessage,
      });
      return;
    }

    next();
  };
};