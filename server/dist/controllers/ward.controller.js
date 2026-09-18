"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWard = exports.updateWard = exports.createWard = exports.getWards = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getWards = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const wards = await models_1.Ward.find().sort({ floor: 1, name: 1 }).lean();
    const formattedWards = await Promise.all(wards.map(async (w) => {
        const beds = await models_1.Bed.find({ wardId: w._id }).lean();
        const bedsWithAdmissions = await Promise.all(beds.map(async (b) => {
            const activeAdmission = await models_1.Admission.findOne({
                bedId: b._id,
                status: 'ACTIVE',
            })
                .populate({
                path: 'patientId',
                populate: { path: 'userId', select: 'name phone' },
            })
                .populate({
                path: 'admittingDoctorId',
                populate: { path: 'userId', select: 'name' },
            })
                .lean();
            return {
                ...b,
                id: b._id.toString(),
                admissions: activeAdmission
                    ? [
                        {
                            ...activeAdmission,
                            id: activeAdmission._id.toString(),
                            patient: activeAdmission.patientId
                                ? {
                                    ...activeAdmission.patientId,
                                    id: activeAdmission.patientId._id.toString(),
                                    user: activeAdmission.patientId.userId,
                                }
                                : null,
                            doctor: activeAdmission.admittingDoctorId
                                ? {
                                    ...activeAdmission.admittingDoctorId,
                                    id: activeAdmission.admittingDoctorId._id.toString(),
                                    user: activeAdmission.admittingDoctorId.userId,
                                }
                                : null,
                        },
                    ]
                    : [],
            };
        }));
        const total = bedsWithAdmissions.length;
        const available = bedsWithAdmissions.filter((b) => b.status === 'AVAILABLE').length;
        const occupied = bedsWithAdmissions.filter((b) => b.status === 'OCCUPIED').length;
        const reserved = bedsWithAdmissions.filter((b) => b.status === 'RESERVED').length;
        const cleaning = bedsWithAdmissions.filter((b) => b.status === 'CLEANING').length;
        const maintenance = bedsWithAdmissions.filter((b) => b.status === 'MAINTENANCE').length;
        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return {
            ...w,
            id: w._id.toString(),
            beds: bedsWithAdmissions,
            stats: {
                total,
                available,
                occupied,
                reserved,
                cleaning,
                maintenance,
                occupancyRate,
            },
        };
    }));
    res.json({ success: true, data: formattedWards });
});
exports.createWard = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { name, code, type, floor, capacity, description } = req.body;
    if (!name || !code)
        throw new error_middleware_1.AppError('Ward name and code are required', 400);
    const existing = await models_1.Ward.findOne({
        $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
    });
    if (existing)
        throw new error_middleware_1.AppError('Ward with this name or code already exists', 400);
    const ward = await models_1.Ward.create({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        type: type || 'GENERAL',
        floor: Number(floor) || 1,
        capacity: Number(capacity) || 10,
        description,
    });
    res.status(201).json({
        success: true,
        message: 'Ward created successfully',
        data: {
            ...ward.toJSON(),
            id: ward._id.toString(),
        },
    });
});
exports.updateWard = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Ward ID', 400);
    const { name, code, type, floor, capacity, description } = req.body;
    const updateFields = {};
    if (name)
        updateFields.name = name.trim();
    if (code)
        updateFields.code = code.toUpperCase().trim();
    if (type)
        updateFields.type = type;
    if (floor !== undefined)
        updateFields.floor = Number(floor);
    if (capacity !== undefined)
        updateFields.capacity = Number(capacity);
    if (description !== undefined)
        updateFields.description = description;
    const ward = await models_1.Ward.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
    if (!ward)
        throw new error_middleware_1.AppError('Ward not found', 404);
    res.json({
        success: true,
        message: 'Ward updated successfully',
        data: {
            ...ward,
            id: ward._id.toString(),
        },
    });
});
exports.deleteWard = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Ward ID', 400);
    // Check if any beds in this ward have active admissions
    const wardBeds = await models_1.Bed.find({ wardId: id }).distinct('_id');
    const activeAdmissions = await models_1.Admission.exists({
        bedId: { $in: wardBeds },
        status: 'ACTIVE',
    });
    if (activeAdmissions) {
        throw new error_middleware_1.AppError('Cannot delete ward with active patient admissions', 400);
    }
    // Delete all beds associated with ward
    await models_1.Bed.deleteMany({ wardId: id });
    await models_1.Ward.findByIdAndDelete(id);
    res.json({ success: true, message: 'Ward and its beds deleted successfully' });
});
