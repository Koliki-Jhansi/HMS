"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartmentById = exports.getDepartments = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getDepartments = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const departments = await models_1.Department.find().sort({ name: 1 }).lean();
    const formatted = await Promise.all(departments.map(async (dept) => {
        const doctors = await models_1.Doctor.find({ departmentId: dept._id })
            .populate('userId', 'name email phone avatar')
            .lean();
        const appointmentsCount = await models_1.Appointment.countDocuments({ departmentId: dept._id });
        return {
            ...dept,
            id: dept._id.toString(),
            doctors: doctors.map((d) => ({
                ...d,
                id: d._id.toString(),
                user: d.userId,
            })),
            _count: {
                doctors: doctors.length,
                appointments: appointmentsCount,
            },
        };
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
});
exports.getDepartmentById = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Department ID', 400);
    const department = await models_1.Department.findById(id).lean();
    if (!department)
        throw new error_middleware_1.AppError('Department not found', 404);
    const doctors = await models_1.Doctor.find({ departmentId: department._id })
        .populate('userId', 'name email phone avatar')
        .lean();
    res.json({
        success: true,
        data: {
            ...department,
            id: department._id.toString(),
            doctors: doctors.map((d) => ({
                ...d,
                id: d._id.toString(),
                user: d.userId,
            })),
        },
    });
});
exports.createDepartment = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { name, code, description, icon } = req.body;
    if (!name || !code)
        throw new error_middleware_1.AppError('Department name and unique code are required', 400);
    const existing = await models_1.Department.findOne({
        $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
    });
    if (existing)
        throw new error_middleware_1.AppError('Department name or code already exists', 400);
    const department = await models_1.Department.create({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description,
        icon: icon || 'Building2',
    });
    res.status(201).json({
        success: true,
        message: 'Department created',
        data: {
            ...department.toJSON(),
            id: department._id.toString(),
        },
    });
});
exports.updateDepartment = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Department ID', 400);
    const { name, code, description, icon } = req.body;
    const updateFields = {};
    if (name)
        updateFields.name = name.trim();
    if (code)
        updateFields.code = code.toUpperCase().trim();
    if (description !== undefined)
        updateFields.description = description;
    if (icon)
        updateFields.icon = icon;
    const department = await models_1.Department.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
    if (!department)
        throw new error_middleware_1.AppError('Department not found', 404);
    res.json({
        success: true,
        message: 'Department updated',
        data: {
            ...department,
            id: department._id.toString(),
        },
    });
});
exports.deleteDepartment = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Department ID', 400);
    const hasDoctors = await models_1.Doctor.exists({ departmentId: id });
    if (hasDoctors) {
        throw new error_middleware_1.AppError('Cannot delete department with assigned doctors. Reassign doctors first.', 400);
    }
    await models_1.Department.findByIdAndDelete(id);
    res.json({ success: true, message: 'Department deleted successfully' });
});
