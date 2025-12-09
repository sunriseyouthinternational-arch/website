const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection cache for serverless
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    console.log('Creating new MongoDB connection...');

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('MongoDB connected successfully (serverless)');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}

// CRITICAL: Connect to database BEFORE loading any routes
// This ensures models are registered AFTER connection is established
let routesInitialized = false;
let authRoutes, memberRoutes, classRoutes, activityRoutes, adminRoutes;

async function initializeRoutes() {
  if (routesInitialized) {
    return;
  }

  console.log('Initializing routes...');

  // Import routes (which will also load models) AFTER database connection
  authRoutes = require('../server/routes/auth-serverless');
  memberRoutes = require('../server/routes/members-serverless');
  classRoutes = require('../server/routes/classes-serverless');
  activityRoutes = require('../server/routes/activities-serverless');
  adminRoutes = require('../server/routes/admin-serverless');

  // Mount routes with /api prefix
  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/classes', classRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/admin', adminRoutes);

  routesInitialized = true;
  console.log('Routes initialized successfully');
}

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
    timestamp: new Date().toISOString()
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
    await connectToDatabase();

    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    res.json({
      status: 'success',
      message: 'Database connection successful',
      mongoUri: maskedUri,
      connectionState: states[mongoose.connection.readyState],
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

// Middleware to ensure database connection and routes are initialized
app.use(async (req, res, next) => {
  // Skip for static routes
  if (req.path === '/' || req.path === '/api' || req.path === '/api/health' || req.path === '/api/test-db') {
    return next();
  }

  try {
    console.log(`Request: ${req.method} ${req.path}`);

    // Step 1: Ensure database is connected
    await connectToDatabase();

    // Step 2: Initialize routes (loads models AFTER connection is ready)
    await initializeRoutes();

    console.log('Database and routes ready, proceeding with request...');
    next();
  } catch (error) {
    console.error('Request initialization error:', error);
    res.status(500).json({
      message: '數據庫連接失敗 / Database connection failed',
      error: error.message,
      readyState: mongoose.connection.readyState
    });
  }
});

// 404 handler - log for debugging
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
