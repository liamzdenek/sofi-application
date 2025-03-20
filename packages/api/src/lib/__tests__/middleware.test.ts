import { Request, Response, NextFunction } from 'express';
import { requestLogger, validateEnvVars, validateRequest } from '../middleware';
import { logger } from '../logger';

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  handleError: jest.fn(),
}));

describe('Middleware', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLogger', () => {
    it('should log incoming requests', () => {
      // Create mock request, response, and next function
      const req = {
        method: 'GET',
        path: '/test',
        query: { param: 'value' },
        body: { data: 'test' },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
      } as unknown as Request;

      const res = {
        statusCode: 200,
        end: jest.fn(),
      } as unknown as Response;

      const next = jest.fn() as NextFunction;

      // Call the middleware
      requestLogger(req, res, next);

      // Check if logger.info was called with the correct parameters
      expect(logger.info).toHaveBeenCalledWith('Incoming request', {
        method: 'GET',
        path: '/test',
        query: { param: 'value' },
        body: { data: 'test' },
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      // Check if next was called
      expect(next).toHaveBeenCalled();

      // Simulate response end
      res.end();

      // Check if logger.info was called again with the response info
      expect(logger.info).toHaveBeenCalledWith('Outgoing response', {
        method: 'GET',
        path: '/test',
        statusCode: 200,
        duration: expect.stringMatching(/^\d+ms$/),
      });
    });
  });

  describe('validateEnvVars', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should not throw an error if all required variables are present', () => {
      // Set environment variables
      process.env.TEST_VAR1 = 'value1';
      process.env.TEST_VAR2 = 'value2';

      // Call the function
      expect(() => validateEnvVars(['TEST_VAR1', 'TEST_VAR2'])).not.toThrow();
    });

    it('should throw an error if any required variable is missing', () => {
      // Set only one environment variable
      process.env.TEST_VAR1 = 'value1';

      // Call the function and expect it to throw
      expect(() => validateEnvVars(['TEST_VAR1', 'TEST_VAR2'])).toThrow(
        'Missing required environment variables: TEST_VAR2'
      );

      // Check if logger.error was called
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('validateRequest', () => {
    it('should call next if validation passes', () => {
      // Create a mock schema
      const schema = {
        validate: jest.fn().mockReturnValue({}),
      };

      // Create mock request, response, and next function
      const req = {
        body: { data: 'test' },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const next = jest.fn() as NextFunction;

      // Create the middleware
      const middleware = validateRequest(schema);

      // Call the middleware
      middleware(req, res, next);

      // Check if schema.validate was called with the request body
      expect(schema.validate).toHaveBeenCalledWith({ data: 'test' });

      // Check if next was called
      expect(next).toHaveBeenCalled();

      // Check that res.status and res.json were not called
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error if validation fails', () => {
      // Create a mock schema with validation error
      const schema = {
        validate: jest.fn().mockReturnValue({
          error: {
            details: [{ message: 'Validation failed' }],
          },
        }),
      };

      // Create mock request, response, and next function
      const req = {
        method: 'POST',
        path: '/test',
        body: { data: 'invalid' },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const next = jest.fn() as NextFunction;

      // Create the middleware
      const middleware = validateRequest(schema);

      // Call the middleware
      middleware(req, res, next);

      // Check if schema.validate was called with the request body
      expect(schema.validate).toHaveBeenCalledWith({ data: 'invalid' });

      // Check if logger.warn was called
      expect(logger.warn).toHaveBeenCalledWith('Request validation failed', {
        method: 'POST',
        path: '/test',
        error: 'Validation failed',
      });

      // Check if res.status was called with 400
      expect(res.status).toHaveBeenCalledWith(400);

      // Check if res.json was called with the error message
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation error',
        error: 'Validation failed',
      });

      // Check that next was not called
      expect(next).not.toHaveBeenCalled();
    });
  });
});