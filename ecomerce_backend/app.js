require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

// Import centralized router
const router = require('./routes');

// Import error middleware
const errorMiddleware = require('./middlewares/error.middleware');

// Import job scheduler
const { initializeJobs } = require('./jobs');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression - Compress response bodies
app.use(compression());

// CORS Configuration - Allow specific origins for production and development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:5173', // Vite dev server default
  'https://ecomerce-woas.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// ============================================
// BODY PARSING & LOGGING
// ============================================

// CRITICAL: Stripe webhook endpoint needs raw body for signature verification
// This middleware must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parser - Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Use centralized router for all API routes
app.use(router);

// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'E-commerce Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      cart: '/api/cart',
      payments: '/api/payments',
      chat: '/api/chat'
    },
    documentation: 'API documentation available at /api/docs'
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler - Route not found
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode
    });
  }

  // Send error response
  res.status(statusCode).json({
    status,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// BACKGROUND JOBS INITIALIZATION
// ============================================

// Initialize all scheduled jobs (cron jobs)
// This starts the automatic earnings processor and other background tasks
if (process.env.NODE_ENV !== 'test') {
  // Only run jobs in non-test environments
  initializeJobs();
  console.log('[App] Background jobs initialized');
}

module.exports = app;
