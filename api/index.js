const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Disable Mongoose buffering globally for serverless
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes (use serverless versions for Vercel)
const authRoutes = require('../server/routes/auth');
const memberRoutes = require('../server/routes/members-serverless');
const classRoutes = require('../server/routes/classes-serverless');
const activityRoutes = require('../server/routes/activities-serverless');
const adminRoutes = require('../server/routes/admin');

// Database connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return mongoose.connection;
  }

  // If currently connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    console.log('Waiting for existing connection attempt...');
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
    return mongoose.connection;
  }

  try {
    console.log('Creating new MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log('MongoDB connected successfully (serverless)');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Connect to database before handling requests
app.use(async (req, res, next) => {
  try {
    console.log('Middleware - ensuring DB connection...');
    await connectToDatabase();

    // Double-check connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database not ready. ReadyState: ${mongoose.connection.readyState}`);
    }

    console.log('Middleware - DB connection confirmed, proceeding...');
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

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    // Check if URI exists
    if (!mongoUri) {
      return res.status(500).json({
        status: 'error',
        message: 'MONGODB_URI environment variable is not set',
        mongoUriExists: false
      });
    }

    // Mask password in URI for display
    const maskedUri = mongoUri.replace(/:[^:@]+@/, ':****@');

    // Try to connect
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    if (connectionState === 1) {
      return res.json({
        status: 'connected',
        message: 'Database is connected',
        mongoUri: maskedUri,
        connectionState: states[connectionState],
        database: mongoose.connection.name,
        host: mongoose.connection.host
      });
    }

    // Try to connect if not connected
    await connectToDatabase();

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

// API Routes - mount with /api prefix because Vercel preserves full path
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '晨光國際少年團 API - Sunrise Youth International API',
    timestamp: new Date().toISOString()
  });
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
