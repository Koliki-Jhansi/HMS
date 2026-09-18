"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBedStats = exports.deleteBed = exports.updateBedDetails = exports.updateBedStatus = exports.createBed = exports.getBedById = exports.getBeds = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getBeds = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { wardId, status, type, search } = req.query;
    const query = {};
    if (wardId && wardId !== 'ALL') {
        if (mongoose_1.default.Types.ObjectId.isValid(String(wardId))) {
            query.wardId = new mongoose_1.default.Types.ObjectId(String(wardId));
        }
    }
    if (status && status !== 'ALL') {
        query.status = String(status);
    }
    if (search) {
        query.bedNumber = { $regex: String(search), $options: 'i' };
    }
    let beds = await models_1.Bed.find(query)
        .populate('wardId')
        .sort({ bedNumber: 1 })
        .lean();
    if (type && type !== 'ALL') {
        beds = beds.filter((b) => b.wardId?.type === type);
    }
    const bedsWithAdmissions = await Promise.all(beds.map(async (b) => {
        const activeAdmission = await models_1.Admission.findOne({
            bedId: b._id,
            status: 'ACTIVE',
        })
            .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'name phone email avatar' },
        })
            .populate({
            path: 'admittingDoctorId',
            populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }],
        })
            .lean();
        return {
            ...b,
            id: b._id.toString(),
            ward: b.wardId
                ? {
                    ...b.wardId,
                    id: b.wardId._id ? b.wardId._id.toString() : b.wardId.toString(),
                }
                : null,
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
                                department: activeAdmission.admittingDoctorId.departmentId,
                            }
                            : null,
                    },
                ]
                : [],
        };
    }));
    res.json({ success: true, count: bedsWithAdmissions.length, data: bedsWithAdmissions });
});
exports.getBedById = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Bed ID', 400);
    const bed = await models_1.Bed.findById(id).populate('wardId').lean();
    if (!bed)
        throw new error_middleware_1.AppError('Bed not found', 404);
    const admissions = await models_1.Admission.find({ bedId: bed._id })
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name phone' },
    })
        .populate({
        path: 'admittingDoctorId',
        populate: { path: 'userId', select: 'name' },
    })
        .sort({ admissionDate: -1 })
        .lean();
    res.json({
        success: true,
        data: {
            ...bed,
            id: bed._id.toString(),
            ward: bed.wardId,
            admissions: admissions.map((adm) => ({
                ...adm,
                id: adm._id.toString(),
                patient: adm.patientId
                    ? {
                        ...adm.patientId,
                        id: adm.patientId._id.toString(),
                        user: adm.patientId.userId,
                    }
                    : null,
                doctor: adm.admittingDoctorId
                    ? {
                        ...adm.admittingDoctorId,
                        id: adm.admittingDoctorId._id.toString(),
                        user: adm.admittingDoctorId.userId,
                    }
                    : null,
            })),
        },
    });
});
exports.createBed = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { bedNumber, wardId, status, dailyRate, notes } = req.body;
    if (!bedNumber || !wardId) {
        throw new error_middleware_1.AppError('Bed number and ward are required', 400);
    }
    const existing = await models_1.Bed.findOne({ bedNumber: bedNumber.trim() });
    if (existing) {
        throw new error_middleware_1.AppError(`Bed number "${bedNumber}" already exists`, 400);
    }
    const bed = await models_1.Bed.create({
        bedNumber: bedNumber.trim(),
        wardId: new mongoose_1.default.Types.ObjectId(wardId),
        status: status || 'AVAILABLE',
        dailyRate: dailyRate !== undefined ? Number(dailyRate) : 100.0,
        notes,
    });
    const populated = await models_1.Bed.findById(bed._id).populate('wardId').lean();
    res.status(201).json({
        success: true,
        message: 'Bed created successfully',
        data: {
            ...populated,
            id: populated?._id.toString(),
            ward: populated?.wardId,
        },
    });
});
exports.updateBedStatus = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Bed ID', 400);
    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE'];
    if (!validStatuses.includes(status)) {
        throw new error_middleware_1.AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    // Prevent changing status from OCCUPIED if there is an active admission
    if (status !== 'OCCUPIED') {
        const activeAdm = await models_1.Admission.findOne({ bedId: id, status: 'ACTIVE' });
        if (activeAdm) {
            throw new error_middleware_1.AppError('Cannot change bed status while patient is actively admitted. Please discharge the patient first.', 400);
        }
    }
    const updateFields = { status };
    if (notes !== undefined)
        updateFields.notes = notes;
    const bed = await models_1.Bed.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
        .populate('wardId')
        .lean();
    if (!bed)
        throw new error_middleware_1.AppError('Bed not found', 404);
    res.json({
        success: true,
        message: `Bed status updated to ${status}`,
        data: {
            ...bed,
            id: bed._id.toString(),
            ward: bed.wardId,
        },
    });
});
exports.updateBedDetails = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { bedNumber, wardId, dailyRate, notes } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Bed ID', 400);
    const updateFields = {};
    if (bedNumber)
        updateFields.bedNumber = bedNumber.trim();
    if (wardId)
        updateFields.wardId = new mongoose_1.default.Types.ObjectId(wardId);
    if (dailyRate !== undefined)
        updateFields.dailyRate = Number(dailyRate);
    if (notes !== undefined)
        updateFields.notes = notes;
    const bed = await models_1.Bed.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
        .populate('wardId')
        .lean();
    if (!bed)
        throw new error_middleware_1.AppError('Bed not found', 404);
    res.json({
        success: true,
        message: 'Bed details updated',
        data: {
            ...bed,
            id: bed._id.toString(),
            ward: bed.wardId,
        },
    });
});
exports.deleteBed = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Bed ID', 400);
    const activeAdm = await models_1.Admission.findOne({ bedId: id, status: 'ACTIVE' });
    if (activeAdm) {
        throw new error_middleware_1.AppError('Cannot delete a bed with an active admission', 400);
    }
    await models_1.Bed.findByIdAndDelete(id);
    res.json({ success: true, message: 'Bed deleted successfully' });
});
exports.getBedStats = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const [total, available, occupied, reserved, cleaning, maintenance] = await Promise.all([
        models_1.Bed.countDocuments(),
        models_1.Bed.countDocuments({ status: 'AVAILABLE' }),
        models_1.Bed.countDocuments({ status: 'OCCUPIED' }),
        models_1.Bed.countDocuments({ status: 'RESERVED' }),
        models_1.Bed.countDocuments({ status: 'CLEANING' }),
        models_1.Bed.countDocuments({ status: 'MAINTENANCE' }),
    ]);
    const wards = await models_1.Ward.find().lean();
    const wardBreakdown = await Promise.all(wards.map(async (w) => {
        const wardBeds = await models_1.Bed.find({ wardId: w._id }).lean();
        return {
            wardId: w._id.toString(),
            wardName: w.name,
            type: w.type,
            floor: w.floor,
            total: wardBeds.length,
            available: wardBeds.filter((b) => b.status === 'AVAILABLE').length,
            occupied: wardBeds.filter((b) => b.status === 'OCCUPIED').length,
        };
    }));
    res.json({
        success: true,
        data: {
            total,
            available,
            occupied,
            reserved,
            cleaning,
            maintenance,
            occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
            wardBreakdown,
        },
    });
});
