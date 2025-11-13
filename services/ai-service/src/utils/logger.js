const winston = require('winston');
const config = require('../config');
const { format } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // Handle error objects
  if (meta.stack) {
    log += `\n${meta.stack}`;
    delete meta.stack;
  }
  
  // Add additional metadata if present
  const metaString = Object.keys(meta).length > 0 
    ? `\n${JSON.stringify(meta, null, 2)}` 
    : '';
    
  return `${log}${metaString}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  levels,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    config.env === 'production' ? json() : combine(colorize(), consoleFormat)
  ),
  defaultMeta: { service: 'ai-service' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// If we're not in production, log to the console as well
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    ),
    handleExceptions: true,
  }));
}

// Create a stream object with a 'write' function for morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Handle uncaught exceptions and unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Recommended: send the information to a crash reporting service
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  // Recommended: send the information to a crash reporting service
  process.exit(1); // Mandatory (as per the Node.js docs)
});

module.exports = logger;
