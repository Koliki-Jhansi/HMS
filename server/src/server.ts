import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import statsRoutes from './routes/stats.routes';
import doctorRoutes from './routes/doctor.routes';
import patientRoutes from './routes/patient.routes';
import departmentRoutes from './routes/department.routes';
import wardRoutes from './routes/ward.routes';
import bedRoutes from './routes/bed.routes';
import admissionRoutes from './routes/admission.routes';
import appointmentRoutes from './routes/appointment.routes';
import prescriptionRoutes from './routes/prescription.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';

import { errorHandler } from './middleware/error.middleware';
import connectDB from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================================
   CORS CONFIGURATION (Production & Localhost Support)
   ========================================================= */

const defaultAllowedOrigins = [
  // Production frontend on Vercel
  'https://hms-omega-puce.vercel.app',

  // Local development frontends
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Combine with optional comma-separated CLIENT_URL from .env
const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : [];

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envOrigins].map((u) => u.replace(/\/+$/, '')))
);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server, Render health checks)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/+$/, '');

    // Allow exact matches or any vercel.app preview deployment
    if (
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
    return callback(new Error(`CORS policy does not allow origin: ${origin}`));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],

  exposedHeaders: ['Authorization'],

  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

/* =========================================================
   GENERAL MIDDLEWARE
   ========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    system: 'Hospital Management System API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES
   ========================================================= */

app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================================================
   CENTRAL ERROR HANDLER
   ========================================================= */

app.use(errorHandler);

/* =========================================================
   START SERVER
   ========================================================= */

export const startServer = async () => {
  try {
    // Connect MongoDB Atlas
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('========================================');
      console.log('🏥 Hospital Management System API');
      console.log('========================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);

      if (process.env.NODE_ENV === 'production') {
        console.log('🔗 API: https://hms-khdj.onrender.com/api');
      } else {
        console.log(`🔗 API: http://localhost:${PORT}/api`);
      }

      console.log('========================================');
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;