const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const skillRoutes = require('./routes/skills');
const resourceRoutes = require('./routes/resources');
const bookmarkRoutes = require('./routes/bookmarks');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Configuration
const CONFIG = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-enhancement',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests per window
};

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin) || CONFIG.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW,
  max: CONFIG.RATE_LIMIT_MAX,
  message: { 
    error: 'Too many requests from this IP, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => CONFIG.NODE_ENV === 'development', // Skip in development
});
app.use('/api/', limiter);

// ============================================================================
// General Middleware
// ============================================================================

// Compression for responses
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      console.error(`❌ ${logMessage}`);
    } else if (CONFIG.NODE_ENV === 'development') {
      console.log(`📝 ${logMessage}`);
    }
  });
  
  next();
});

// ============================================================================
// Database Connection
// ============================================================================

const connectDatabase = async () => {
  try {
    await mongoose.connect(CONFIG.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// ============================================================================
// API Routes
// ============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    message: 'Skill Enhancement API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: CONFIG.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  };
  
  res.json(healthCheck);
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Skill Enhancement Platform API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      skills: '/api/skills',
      resources: '/api/resources',
      bookmarks: '/api/bookmarks',
      admin: '/api/admin',
      health: '/api/health',
    },
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler - must be before error handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error
  console.error('❌ Error:', err.message);
  if (CONFIG.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Handle specific error types
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(CONFIG.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    }),
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();

    // Start server
    const server = app.listen(CONFIG.PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Skill Enhancement Platform API');
      console.log('='.repeat(50));
      console.log(`📡 Server: http://localhost:${CONFIG.PORT}`);
      console.log(`🌍 Environment: ${CONFIG.NODE_ENV}`);
      console.log(`📋 API Docs: http://localhost:${CONFIG.PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${CONFIG.PORT}/api/health`);
      console.log('='.repeat(50) + '\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          await mongoose.connection.close();
          console.log('🔌 Database connection closed');
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
startServer();

module.exports = app; // Export for testing