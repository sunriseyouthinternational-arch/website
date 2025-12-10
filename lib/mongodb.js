const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  console.log('[MongoDB] connectDB called');

  if (cached.conn) {
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[MongoDB] Creating new connection promise');
    console.log('[MongoDB] MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('[MongoDB] MONGODB_URI preview:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT SET');

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] Connection successful!');
      return mongoose;
    }).catch((error) => {
      console.error('[MongoDB] Connection failed:', error.message);
      throw error;
    });
  }

  try {
    console.log('[MongoDB] Awaiting connection...');
    cached.conn = await cached.promise;
    console.log('[MongoDB] Connection established!');
  } catch (e) {
    console.error('[MongoDB] Error during connection:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;
