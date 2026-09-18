"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).default('PATIENT'),
    // Optional patient profile fields
    gender: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    bloodGroup: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
    allergies: zod_1.z.string().optional(),
    chronicConditions: zod_1.z.string().optional(),
    // Optional doctor profile fields
    specialization: zod_1.z.string().optional(),
    licenseNumber: zod_1.z.string().optional(),
    qualification: zod_1.z.string().optional(),
    experienceYears: zod_1.z.number().optional(),
    consultationFee: zod_1.z.number().optional(),
    departmentId: zod_1.z.string().optional(),
});
const generateToken = (userId, email, role) => {
    const secret = process.env.JWT_SECRET || 'super_secret_hospital_jwt_token_key_2026';
    return jsonwebtoken_1.default.sign({ id: userId, email, role }, secret, { expiresIn: '7d' });
};
exports.register = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new error_middleware_1.AppError(parsed.error.errors[0].message, 400);
    }
    const { name, email, password, phone, role, gender, dateOfBirth, bloodGroup, address, emergencyContactName, emergencyContactPhone, allergies, chronicConditions, specialization, licenseNumber, qualification, experienceYears, consultationFee, departmentId, } = parsed.data;
    const existingUser = await models_1.User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        throw new error_middleware_1.AppError('Email address is already registered', 400);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newUser = await models_1.User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim(),
        role,
        status: 'ACTIVE',
    });
    let patientDoc = null;
    let doctorDoc = null;
    if (role === 'PATIENT') {
        const mrnCount = await models_1.Patient.countDocuments();
        const mrn = `MRN-2026-${(1001 + mrnCount).toString()}`;
        patientDoc = await models_1.Patient.create({
            userId: newUser._id,
            medicalRecordNumber: mrn,
            gender: gender,
            dateOfBirth,
            bloodGroup,
            address,
            emergencyContactName,
            emergencyContactPhone,
            allergies,
            chronicConditions,
        });
    }
    else if (role === 'DOCTOR') {
        const docCount = await models_1.Doctor.countDocuments();
        doctorDoc = await models_1.Doctor.create({
            userId: newUser._id,
            specialization: specialization || 'General Medicine',
            licenseNumber: licenseNumber || `MD-LIC-${1000 + docCount}`,
            qualification: qualification || 'MBBS, MD',
            experienceYears: experienceYears || 3,
            consultationFee: consultationFee || 60,
            departmentId: departmentId || undefined,
        });
    }
    // Welcome notification
    await models_1.Notification.create({
        userId: newUser._id,
        title: 'Welcome to Hospital Care Portal',
        message: `Welcome ${name}! Your account has been successfully created with role ${role}.`,
        type: 'SYSTEM',
    });
    const token = generateToken(newUser._id.toString(), newUser.email, newUser.role);
    res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            phone: newUser.phone,
            avatar: newUser.avatar,
            patient: patientDoc,
            doctor: doctorDoc,
        },
    });
});
exports.login = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new error_middleware_1.AppError('Email and password are required', 400);
    }
    const user = await models_1.User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        throw new error_middleware_1.AppError('Invalid email or password credentials', 401);
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new error_middleware_1.AppError('Invalid email or password credentials', 401);
    }
    if (user.status !== 'ACTIVE') {
        throw new error_middleware_1.AppError('Your account has been deactivated. Please contact administration.', 403);
    }
    let patient = null;
    let doctor = null;
    if (user.role === 'PATIENT') {
        patient = await models_1.Patient.findOne({ userId: user._id });
    }
    else if (user.role === 'DOCTOR') {
        doctor = await models_1.Doctor.findOne({ userId: user._id }).populate('departmentId');
    }
    const token = generateToken(user._id.toString(), user.email, user.role);
    res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            patient,
            doctor,
        },
    });
});
exports.getMe = (0, error_middleware_1.catchAsync)(async (req, res) => {
    if (!req.user) {
        throw new error_middleware_1.AppError('Not authenticated', 401);
    }
    const user = await models_1.User.findById(req.user.id);
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    let patient = null;
    let doctor = null;
    if (user.role === 'PATIENT') {
        patient = await models_1.Patient.findOne({ userId: user._id });
    }
    else if (user.role === 'DOCTOR') {
        doctor = await models_1.Doctor.findOne({ userId: user._id }).populate('departmentId');
    }
    res.json({
        success: true,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            patient,
            doctor,
        },
    });
});
exports.updateProfile = (0, error_middleware_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw new error_middleware_1.AppError('Not authenticated', 401);
    const { name, phone, avatar, patientData, doctorData } = req.body;
    const updateFields = {};
    if (name)
        updateFields.name = name;
    if (phone !== undefined)
        updateFields.phone = phone;
    if (avatar !== undefined)
        updateFields.avatar = avatar;
    const user = await models_1.User.findByIdAndUpdate(req.user.id, updateFields, { new: true });
    if (!user)
        throw new error_middleware_1.AppError('User not found', 404);
    let patient = null;
    let doctor = null;
    if (user.role === 'PATIENT' && patientData) {
        patient = await models_1.Patient.findOneAndUpdate({ userId: user._id }, { $set: patientData }, { new: true, upsert: true });
    }
    else if (user.role === 'PATIENT') {
        patient = await models_1.Patient.findOne({ userId: user._id });
    }
    if (user.role === 'DOCTOR' && doctorData) {
        doctor = await models_1.Doctor.findOneAndUpdate({ userId: user._id }, { $set: doctorData }, { new: true }).populate('departmentId');
    }
    else if (user.role === 'DOCTOR') {
        doctor = await models_1.Doctor.findOne({ userId: user._id }).populate('departmentId');
    }
    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            patient,
            doctor,
        },
    });
});
