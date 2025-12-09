// Test MongoDB Atlas Connection
const mongoose = require('mongoose');

// Replace with your actual connection string
const MONGODB_URI = 'mongodb+srv://sunriseyouthinternational_db_user:YOUR_PASSWORD@sunrise-main.8d4psx7.mongodb.net/sunrise-youth?retryWrites=true&w=majority&appName=sunrise-main';

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);

    // Try to create a test document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);

    const testDoc = new TestModel({ test: 'Connection successful!' });
    await testDoc.save();
    console.log('✅ Test document created successfully!');

    // Clean up test document
    await TestModel.deleteMany({ test: 'Connection successful!' });
    console.log('🧹 Test cleanup complete');

    await mongoose.connection.close();
    console.log('👋 Connection closed');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
