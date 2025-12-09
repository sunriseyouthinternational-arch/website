const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Connection promise - start immediately
const connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
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
  throw error;
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    res.json({
      status: connectionState === 1 ? 'success' : 'warning',
      message: connectionState === 1 ? 'Database is connected' : `Database state: ${states[connectionState]}`,
      mongoUri: maskedUri,
      connectionState: states[connectionState],
      database: mongoose.connection.name || 'N/A',
      host: mongoose.connection.host || 'N/A'
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

// Import routes - models will register during this
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

// CRITICAL: Export a wrapper function that waits for connection before processing
// This ensures the connection is COMPLETE before any route handler executes
module.exports = async (req, res) => {
  try {
    // Wait for connection to complete
    await connectionPromise;

    // Ensure connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not ready after connection promise resolved:', mongoose.connection.readyState);
      return res.status(500).json({
        message: '數據庫連接失敗 / Database connection failed',
        readyState: mongoose.connection.readyState
      });
    }

    // Connection is ready, process the request through Express
    return app(req, res);
  } catch (error) {
    console.error('Request handler error:', error);
    return res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message
    });
  }
};

// Also export as default for compatibility
module.exports.default = module.exports;
