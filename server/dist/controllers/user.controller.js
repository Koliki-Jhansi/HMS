"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.createStaffUser = exports.updateUserStatus = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getUsers = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { role, status, search } = req.query;
    const query = {};
    if (role && role !== 'ALL') {
        query.role = String(role);
    }
    if (status && status !== 'ALL') {
        query.status = String(status);
    }
    let users = await models_1.User.find(query).select('-password').sort({ createdAt: -1 }).lean();
    if (search) {
        const q = String(search).toLowerCase();
        users = users.filter((u) => {
            const name = u.name?.toLowerCase() || '';
            const email = u.email?.toLowerCase() || '';
            const phone = u.phone?.toLowerCase() || '';
            return name.includes(q) || email.includes(q) || phone.includes(q);
        });
    }
    const formattedUsers = await Promise.all(users.map(async (u) => {
        let patient = null;
        let doctor = null;
        if (u.role === 'PATIENT') {
            patient = await models_1.Patient.findOne({ userId: u._id }).lean();
            if (patient) {
                patient = { ...patient, id: patient._id.toString() };
            }
        }
        else if (u.role === 'DOCTOR') {
            doctor = await models_1.Doctor.findOne({ userId: u._id }).populate('departmentId').lean();
            if (doctor) {
                doctor = {
                    ...doctor,
                    id: doctor._id.toString(),
                    department: doctor.departmentId,
                };
            }
        }
        return {
            ...u,
            id: u._id.toString(),
            patient,
            doctor,
        };
    }));
    res.json({ success: true, count: formattedUsers.length, data: formattedUsers });
});
exports.updateUserStatus = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { status, role } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid User ID', 400);
    if (req.user?.id === id && status === 'INACTIVE') {
        throw new error_middleware_1.AppError('Cannot deactivate your own administrator account', 400);
    }
    const updateFields = {};
    if (status)
        updateFields.status = status;
    if (role)
        updateFields.role = role;
    const updated = await models_1.User.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
        .select('-password')
        .lean();
    if (!updated)
        throw new error_middleware_1.AppError('User not found', 404);
    res.json({
        success: true,
        message: 'User updated successfully',
        data: {
            ...updated,
            id: updated._id.toString(),
        },
    });
});
exports.createStaffUser = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { name, email, password, phone, role, specialization, licenseNumber, qualification, experienceYears, consultationFee, departmentId, roomNumber, } = req.body;
    if (!name || !email || !password || !role) {
        throw new error_middleware_1.AppError('Name, email, password, and role are required', 400);
    }
    const existing = await models_1.User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
        throw new error_middleware_1.AppError('User with this email already exists', 400);
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newUser = await models_1.User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim(),
        role,
        status: 'ACTIVE',
    });
    let doctor = null;
    if (role === 'DOCTOR') {
        const docCount = await models_1.Doctor.countDocuments();
        const newDoc = await models_1.Doctor.create({
            userId: newUser._id,
            specialization: specialization || 'General Specialist',
            licenseNumber: licenseNumber || `MD-LIC-${1000 + docCount + 1}`,
            qualification: qualification || 'MBBS, MD',
            experienceYears: experienceYears ? Number(experienceYears) : 3,
            consultationFee: consultationFee ? Number(consultationFee) : 80,
            departmentId: departmentId && mongoose_1.default.Types.ObjectId.isValid(departmentId)
                ? new mongoose_1.default.Types.ObjectId(departmentId)
                : undefined,
            roomNumber,
        });
        doctor = await models_1.Doctor.findById(newDoc._id).populate('departmentId').lean();
    }
    res.status(201).json({
        success: true,
        message: 'Staff member created successfully',
        data: {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            phone: newUser.phone,
            doctor: doctor ? { ...doctor, id: doctor._id.toString() } : null,
        },
    });
});
exports.deleteUser = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid User ID', 400);
    if (req.user?.id === id) {
        throw new error_middleware_1.AppError('Cannot delete your own account', 400);
    }
    await Promise.all([
        models_1.User.findByIdAndDelete(id),
        models_1.Patient.deleteMany({ userId: id }),
        models_1.Doctor.deleteMany({ userId: id }),
    ]);
    res.json({ success: true, message: 'User deleted successfully' });
});
