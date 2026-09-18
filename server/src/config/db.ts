import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

let isConnecting = false;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (isConnecting) {
    while (isConnecting) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return;
  }

  isConnecting = true;
  const mongoURI =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';

  try {
    const maskedURI = mongoURI.includes('@') ? mongoURI.replace(/:([^@]+)@/, ':****@') : mongoURI;
    console.log(`📡 Connecting to MongoDB Database: ${maskedURI}`);

    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    isConnecting = false;
    await autoSeedIfEmpty();
    return;
  } catch (error: any) {
    console.error(`⚠️ Primary MongoDB Connection Failed: ${error.message}`);
    console.log('🔄 Initializing in-memory database fallback to ensure seamless local operation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      const conn = await mongoose.connect(uri);
      console.log(`✅ In-Memory Fallback Database Active: ${conn.connection.host}/${conn.connection.name}`);
      isConnecting = false;
      await autoSeedIfEmpty();
    } catch (fallbackErr: any) {
      isConnecting = false;
      console.error(`❌ Fallback MongoDB Error: ${fallbackErr.message}`);
      console.error('⚠️ Please ensure valid MONGODB_URI in server/.env');
    }
  }
};

async function autoSeedIfEmpty() {
  try {
    const { User } = require('../models/User.model');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Running initial hospital database seeder...');
      const { seedDatabase } = require('../seed/seed');
      await seedDatabase(false);
      console.log('✅ Initial database seed completed!');
    }
  } catch (e: any) {
    console.log('autoSeed note:', e.message);
  }
}

export default connectDB;
