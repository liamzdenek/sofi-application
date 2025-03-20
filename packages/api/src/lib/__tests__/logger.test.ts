import { logger, handleError, LogLevel } from '../logger';

describe('Logger', () => {
  // Spy on console methods
  const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Restore console methods after all tests
  afterAll(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('logger.debug', () => {
    it('should log debug messages in non-production environment', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      // Call logger.debug
      logger.debug('Debug message', { context: 'test' });
      
      // Check if console.debug was called
      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('DEBUG: Debug message');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('Context: {');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('"context": "test"');
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log debug messages in production environment', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';
      
      // Call logger.debug
      logger.debug('Debug message', { context: 'test' });
      
      // Check if console.debug was not called
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('logger.info', () => {
    it('should log info messages', () => {
      // Call logger.info
      logger.info('Info message', { context: 'test' });
      
      // Check if console.info was called
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('INFO: Info message');
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('Context: {');
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('"context": "test"');
    });
  });

  describe('logger.warn', () => {
    it('should log warning messages', () => {
      // Call logger.warn
      logger.warn('Warning message', { context: 'test' });
      
      // Check if console.warn was called
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN: Warning message');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Context: {');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('"context": "test"');
    });
  });

  describe('logger.error', () => {
    it('should log error messages with error object', () => {
      // Create an error
      const error = new Error('Test error');
      
      // Call logger.error
      logger.error('Error message', error, { context: 'test' });
      
      // Check if console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR: Error message');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Context: {');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('"context": "test"');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error: Test error');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Stack:');
    });
  });

  describe('handleError', () => {
    it('should log the error and throw it', () => {
      // Create an error
      const error = new Error('Test error');
      
      // Call handleError and expect it to throw
      expect(() => handleError('Handled error', error)).toThrow('Test error');
      
      // Check if console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR: Handled error');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error: Test error');
    });
  });
});