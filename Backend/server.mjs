import express from 'express';
import connection from './src/database/database.mjs';
import userRoutes from './src/routes/userRoutes.mjs';
import clientRoutes from './src/routes/clientRoutes.mjs';
import agentRoutes from './src/routes/agentRoutes.mjs';
import reportRoutes from './src/routes/reportRoutes.mjs';
import authRoutes from './src/routes/authRoutes.mjs';
import supplierRoutes from './src/routes/supplierRoutes.mjs';
import dashboardRoutes from './src/routes/dashboardRoutes.mjs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenvSafe from 'dotenv-safe';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import morgan from 'morgan';
import expressSanitizer from 'express-sanitizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables against .env.example
dotenvSafe.config({ example: path.join(process.cwd(), '.env.example'), allowEmptyValues: true });

const app = express();

// Security headers with CORS-friendly configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'http://localhost:*'],
      connectSrc: ["'self'", 'http://localhost:*'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// CORS configuration - Must be before other middleware
const corsOptions = {
  origin: ['http://localhost:4200', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Enable compression
app.use(compression());

// Configure request logging
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
  : 'dev';
app.use(morgan(morganFormat, {
  skip: (req) => req.url === '/health' // Skip logging health check requests
}));

// Body parsers with limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add input sanitization middleware
app.use(expressSanitizer());

// Rate limiting with more generous limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

//mount report router under /api/reports
app.use('/api/users', userRoutes);

app.use('/api/auth', authRoutes);
//mount report router under /api/reports
app.use('/api/clients', clientRoutes);
// Mount agent routes under /api/agents (fix missing leading slash)
app.use('/api/agents', agentRoutes);
//mount report router under /api/reports
app.use('/api/reports', reportRoutes);
// Mount supplier routes
app.use('/api/suppliers', supplierRoutes);
// Mount dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbConnection = await connection.getConnection();
    dbConnection.release();

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStats = {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
    };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memory: memoryStats,
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Global error handler
import { errorHandler } from './src/middleware/errorMiddleware.mjs';
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Not Found',
      code: 404
    }
  });
});

// Import and initialize the scheduler
import './src/scheduleNotifications.mjs';

// Test database connection before starting the server
connection.getConnection()
    .then(() => {
        const port = process.env.PORT ? Number(process.env.PORT) : 3000;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}...`);
            console.log('Automatic archiving scheduled for 9:00 AM daily');
        });
    })
    .catch(err => {
        console.error("Failed to connect to the database:", err);
        process.exit(1);
    });