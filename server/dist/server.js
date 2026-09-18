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
// Middleware
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        system: 'Hospital Management System API',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
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
// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
});
// Central error handler
app.use(error_middleware_1.errorHandler);
// Start server after connecting to database
const startServer = async () => {
    try {
        await (0, db_1.default)();
        const server = app.listen(PORT, () => {
            console.log(`🏥 Hospital Management Server running on port ${PORT}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        });
        return server;
    }
    catch (error) {
        console.error('Failed to start server:', error);
    }
};
exports.startServer = startServer;
if (require.main === module) {
    (0, exports.startServer)();
}
exports.default = app;
