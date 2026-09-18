"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const ward_routes_1 = __importDefault(require("./routes/ward.routes"));
const bed_routes_1 = __importDefault(require("./routes/bed.routes"));
const admission_routes_1 = __importDefault(require("./routes/admission.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const prescription_routes_1 = __importDefault(require("./routes/prescription.routes"));
const medicalRecord_routes_1 = __importDefault(require("./routes/medicalRecord.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
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
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins].map((u) => u.replace(/\/+$/, ''))));
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, server-to-server, Render health checks)
        if (!origin) {
            return callback(null, true);
        }
        const cleanOrigin = origin.replace(/\/+$/, '');
        // Allow exact matches or any vercel.app preview deployment
        if (allowedOrigins.includes(cleanOrigin) ||
            cleanOrigin.endsWith('.vercel.app') ||
            cleanOrigin.includes('localhost') ||
            cleanOrigin.includes('127.0.0.1')) {
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
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // Enable pre-flight for all routes
/* =========================================================
   GENERAL MIDDLEWARE
   ========================================================= */
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/stats', stats_routes_1.default);
app.use('/api/doctors', doctor_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/wards', ward_routes_1.default);
app.use('/api/beds', bed_routes_1.default);
app.use('/api/admissions', admission_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/prescriptions', prescription_routes_1.default);
app.use('/api/medical-records', medicalRecord_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/users', user_routes_1.default);
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
app.use(error_middleware_1.errorHandler);
/* =========================================================
   START SERVER
   ========================================================= */
const startServer = async () => {
    try {
        // Connect MongoDB Atlas
        await (0, db_1.default)();
        const server = app.listen(PORT, () => {
            console.log('========================================');
            console.log('🏥 Hospital Management System API');
            console.log('========================================');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);
            if (process.env.NODE_ENV === 'production') {
                console.log('🔗 API: https://hms-khdj.onrender.com/api');
            }
            else {
                console.log(`🔗 API: http://localhost:${PORT}/api`);
            }
            console.log('========================================');
        });
        return server;
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
exports.startServer = startServer;
if (require.main === module) {
    (0, exports.startServer)();
}
exports.default = app;
