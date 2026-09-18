"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
let isConnecting = false;
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState === 1)
        return;
    if (isConnecting) {
        while (isConnecting) {
            await new Promise((r) => setTimeout(r, 100));
        }
        return;
    }
    isConnecting = true;
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    try {
        const maskedURI = mongoURI.includes('@') ? mongoURI.replace(/:([^@]+)@/, ':****@') : mongoURI;
        console.log(`📡 Connecting to MongoDB Database: ${maskedURI}`);
        const conn = await mongoose_1.default.connect(mongoURI, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
        isConnecting = false;
        await autoSeedIfEmpty();
        return;
    }
    catch (error) {
        console.error(`⚠️ Primary MongoDB Connection Failed: ${error.message}`);
        console.log('🔄 Initializing in-memory database fallback to ensure seamless local operation...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            const conn = await mongoose_1.default.connect(uri);
            console.log(`✅ In-Memory Fallback Database Active: ${conn.connection.host}/${conn.connection.name}`);
            isConnecting = false;
            await autoSeedIfEmpty();
        }
        catch (fallbackErr) {
            isConnecting = false;
            console.error(`❌ Fallback MongoDB Error: ${fallbackErr.message}`);
            console.error('⚠️ Please ensure valid MONGODB_URI in server/.env');
        }
    }
};
exports.connectDB = connectDB;
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
    }
    catch (e) {
        console.log('autoSeed note:', e.message);
    }
}
exports.default = exports.connectDB;
