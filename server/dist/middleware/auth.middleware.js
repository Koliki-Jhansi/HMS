"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = require("../models/User.model");
const Patient_model_1 = require("../models/Patient.model");
const Doctor_model_1 = require("../models/Doctor.model");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'super_secret_hospital_jwt_token_key_2026';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await User_model_1.User.findById(decoded.id);
        if (!user || user.status !== 'ACTIVE') {
            res.status(401).json({ success: false, message: 'User not found or account is deactivated' });
            return;
        }
        let patientId;
        let doctorId;
        if (user.role === 'PATIENT') {
            const patient = await Patient_model_1.Patient.findOne({ userId: user._id });
            patientId = patient?._id.toString();
        }
        else if (user.role === 'DOCTOR') {
            const doctor = await Doctor_model_1.Doctor.findOne({ userId: user._id });
            doctorId = doctor?._id.toString();
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            patientId,
            doctorId,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Access restricted to roles [${roles.join(', ')}]`,
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
