/**
 * Logger utility for the API
 * Provides consistent logging across the application
 * Caught errors should be logged and then re-thrown
 */

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log entry structure
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * Format a log entry as a string
 */
const formatLogEntry = (entry: LogEntry): string => {
  const { timestamp, level, message, context, error } = entry;
  
  let logString = `[${timestamp}] ${level}: ${message}`;
  
  if (context) {
    logString += `\nContext: ${JSON.stringify(context, null, 2)}`;
  }
  
  if (error) {
    logString += `\nError: ${error.message}`;
    if (error.stack) {
      logString += `\nStack: ${error.stack}`;
    }
  }
  
  return logString;
};

/**
 * Log a message at the specified level
 */
const log = (
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
): void => {
  const timestamp = new Date().toISOString();
  const entry: LogEntry = {
    timestamp,
    level,
    message,
    context,
    error,
  };
  
  const formattedEntry = formatLogEntry(entry);
  
  switch (level) {
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formattedEntry);
      }
      break;
    case LogLevel.INFO:
      console.info(formattedEntry);
      break;
    case LogLevel.WARN:
      console.warn(formattedEntry);
      break;
    case LogLevel.ERROR:
      console.error(formattedEntry);
      break;
  }
};

/**
 * Logger object with methods for each log level
 */
export const logger = {
  debug: (message: string, context?: Record<string, any>) => 
    log(LogLevel.DEBUG, message, context),
  
  info: (message: string, context?: Record<string, any>) => 
    log(LogLevel.INFO, message, context),
  
  warn: (message: string, context?: Record<string, any>) => 
    log(LogLevel.WARN, message, context),
  
  error: (message: string, error: Error, context?: Record<string, any>) => 
    log(LogLevel.ERROR, message, context, error),
};

/**
 * Error handler that logs the error and then re-throws it
 * This follows the requirement to log errors and then re-throw them
 */
export const handleError = (message: string, error: Error, context?: Record<string, any>): never => {
  logger.error(message, error, context);
  throw error;
};