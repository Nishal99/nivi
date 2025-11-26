import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFileName() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level}: ${message}${metaString ? ' ' + metaString : ''}\n`;
  }

  async log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(formattedMessage);
    }

    // Always write to file
    try {
      const logFile = path.join(this.logDir, this.getLogFileName());
      await fs.promises.appendFile(logFile, formattedMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  error(message, meta = {}) {
    return this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    return this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    return this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      return this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }

  // Additional method to log HTTP errors
  httpError(error, req) {
    const meta = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      statusCode: error.statusCode || 500,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    return this.error(error.message, meta);
  }
}

export default new Logger();