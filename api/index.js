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

// Import routes (use serverless versions for Vercel)
const authRoutes = require('../server/routes/auth');
const memberRoutes = require('../server/routes/members-serverless');
const classRoutes = require('../server/routes/classes-serverless');
const activityRoutes = require('../server/routes/activities-serverless');
const adminRoutes = require('../server/routes/admin');

// Database connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    cachedDb = connection;
    console.log('MongoDB connected (serverless)');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Connect to database before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({
      message: '數據庫連接失敗 / Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Root route for debugging
app.get('/', (req, res) => {
  res.json({
    message: 'Sunrise Youth International API',
    availableRoutes: [
      '/api/health',
      '/api/auth/admin/login',
      '/api/auth/admin/create-default',
      '/api/members',
      '/api/classes',
      '/api/activities',
      '/api/admin'
    ]
  });
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
