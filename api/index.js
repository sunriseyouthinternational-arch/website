const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// CRITICAL: Connect to database IMMEDIATELY on cold start
// This ensures connection exists BEFORE any models are registered
let connectionPromise = null;

function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
    .then(() => {
      console.log('MongoDB connected successfully (serverless)');
      return mongoose.connection;
    })
    .catch(error => {
      console.error('MongoDB connection error:', error);
      connectionPromise = null; // Reset on failure
      throw error;
    });
  }
  return connectionPromise;
}

// Start connection immediately (don't wait for first request)
connectToDatabase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to ensure database connection is ready
app.use(async (req, res, next) => {
  try {
    // Wait for connection if still in progress
    await connectionPromise;

    // Double-check connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database not ready. ReadyState: ${mongoose.connection.readyState}`);
    }

    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    res.status(500).json({
      message: '數據庫連接失敗 / Database connection failed',
      error: error.message,
      readyState: mongoose.connection.readyState
    });
  }
});

// Root route and /api route for debugging
const apiInfo = {
  message: 'Sunrise Youth International API',
  availableRoutes: [
    '/api/health',
    '/api/test-db',
    '/api/auth/admin/login',
    '/api/auth/admin/create-default',
    '/api/members',
    '/api/classes',
    '/api/activities',
    '/api/admin'
  ]
};

app.get('/', (req, res) => res.json(apiInfo));
app.get('/api', (req, res) => res.json(apiInfo));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '晨光國際少年團 API - Sunrise Youth International API',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState
  });
});

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      return res.status(500).json({
        status: 'error',
        message: 'MONGODB_URI environment variable is not set',
        mongoUriExists: false
      });
    }

    const maskedUri = mongoUri.replace(/:[^:@]+@/, ':****@');
    await connectionPromise;

    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    res.json({
      status: connectionState === 1 ? 'success' : 'warning',
      message: connectionState === 1 ? 'Database is connected' : 'Database connection in progress',
      mongoUri: maskedUri,
      connectionState: states[connectionState],
      database: mongoose.connection.name,
      host: mongoose.connection.host
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      errorType: error.name,
      mongoUriMasked: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@') : 'NOT SET'
    });
  }
});

// Import routes AFTER connection is initiated
// Models will register during require(), but connection is already in progress
const authRoutes = require('../server/routes/auth-serverless');
const memberRoutes = require('../server/routes/members-serverless');
const classRoutes = require('../server/routes/classes-serverless');
const activityRoutes = require('../server/routes/activities-serverless');
const adminRoutes = require('../server/routes/admin-serverless');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  console.log('404 - Path not found:', req.method, req.path, req.url);
  res.status(404).json({
    message: 'API endpoint not found / API 端點未找到',
    requestedPath: req.path,
    requestedUrl: req.url
  });
});

// Export handler for Vercel serverless
module.exports = app;
module.exports.default = app;
