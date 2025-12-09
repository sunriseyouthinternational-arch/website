const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Cached app instance and initialization promise
let app = null;
let initPromise = null;

async function initializeApp() {
  // Return cached promise if already initializing/initialized
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    console.log('Initializing app...');

    // Step 1: Connect to database FIRST
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('MongoDB connected successfully (serverless)');

    // Step 2: NOW load Express and routes (which loads models)
    // Models will register with connection already complete
    const express = require('express');
    const cors = require('cors');

    const authRoutes = require('../server/routes/auth-serverless');
    const memberRoutes = require('../server/routes/members-serverless');
    const classRoutes = require('../server/routes/classes-serverless');
    const activityRoutes = require('../server/routes/activities-serverless');
    const adminRoutes = require('../server/routes/admin-serverless');

    console.log('Routes loaded successfully');

    // Step 3: Setup Express app
    app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Root routes
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

    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        message: '晨光國際少年團 API - Sunrise Youth International API',
        timestamp: new Date().toISOString(),
        dbState: mongoose.connection.readyState
      });
    });

    app.get('/api/test-db', async (req, res) => {
      try {
        const mongoUri = process.env.MONGODB_URI;
        const maskedUri = mongoUri ? mongoUri.replace(/:[^:@]+@/, ':****@') : 'NOT SET';
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

        res.json({
          status: 'success',
          message: 'Database is connected',
          mongoUri: maskedUri,
          connectionState: states[mongoose.connection.readyState],
          database: mongoose.connection.name,
          host: mongoose.connection.host
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Database test failed',
          error: error.message
        });
      }
    });

    // Mount API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/members', memberRoutes);
    app.use('/api/classes', classRoutes);
    app.use('/api/activities', activityRoutes);
    app.use('/api/admin', adminRoutes);

    // 404 handler
    app.use((req, res) => {
      console.log('404 - Path not found:', req.method, req.path);
      res.status(404).json({
        message: 'API endpoint not found / API 端點未找到',
        requestedPath: req.path
      });
    });

    console.log('App initialized successfully');
    return app;
  })();

  return initPromise;
}

// Export async handler that initializes on first request
module.exports = async (req, res) => {
  try {
    const appInstance = await initializeApp();
    return appInstance(req, res);
  } catch (error) {
    console.error('Request handler error:', error);
    return res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports.default = module.exports;
