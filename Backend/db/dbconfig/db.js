const mongoose = require('mongoose');
const { MONGODB_CLUSTER_URI, MONGODB_DATABASE } = process.env; // direct destructure

const connectMongoDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('Using database:', MONGODB_DATABASE);

    await mongoose.connect(MONGODB_CLUSTER_URI, {
      dbName: MONGODB_DATABASE,
    });

    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1); // exit the app if connection fails
  }
};

module.exports = { connectMongoDB };
