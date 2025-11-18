import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  notification: 2,
  info: 3,
  debug: 4,
};

// Define custom colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  notification: 'cyan',
  info: 'green',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Write all logs to notification-specific file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/notifications.log'),
      level: 'notification'
    }),
    // Write all errors to error-specific file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/notification-errors.log'),
      level: 'error'
    }),
    // Write all logs to combined file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;