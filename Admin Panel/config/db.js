const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri; 
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
    return uri;
  } catch (err) {
    console.error(`DB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
