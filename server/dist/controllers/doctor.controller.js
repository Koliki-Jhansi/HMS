"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDoctorSchedules = exports.getDoctorPatients = exports.updateDoctorSchedule = exports.getDoctorById = exports.getDoctors = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getDoctors = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { departmentId, search, day } = req.query;
    const query = {};
    if (departmentId && departmentId !== 'ALL') {
        if (mongoose_1.default.Types.ObjectId.isValid(String(departmentId))) {
            query.departmentId = new mongoose_1.default.Types.ObjectId(String(departmentId));
        }
    }
    if (day) {
        query.availableDays = { $regex: String(day), $options: 'i' };
    }
    let doctors = await models_1.Doctor.find(query)
        .populate('userId', 'name email phone avatar status')
        .populate('departmentId', 'name code description')
        .sort({ experienceYears: -1 })
        .lean();
    if (search) {
        const q = String(search).toLowerCase();
        doctors = doctors.filter((doc) => {
            const name = doc.userId?.name?.toLowerCase() || '';
            const spec = doc.specialization?.toLowerCase() || '';
            const qual = doc.qualification?.toLowerCase() || '';
            return name.includes(q) || spec.includes(q) || qual.includes(q);
        });
    }
    // Format id fields
    const formatted = doctors.map((doc) => ({
        ...doc,
        id: doc._id.toString(),
        user: doc.userId
            ? {
                ...doc.userId,
                id: doc.userId._id ? doc.userId._id.toString() : doc.userId.toString(),
            }
            : null,
        department: doc.departmentId
            ? {
                ...doc.departmentId,
                id: doc.departmentId._id ? doc.departmentId._id.toString() : doc.departmentId.toString(),
            }
            : null,
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
});
exports.getDoctorById = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new error_middleware_1.AppError('Invalid Doctor ID format', 400);
    }
    const doctor = await models_1.Doctor.findById(id)
        .populate('userId', 'name email phone avatar status')
        .populate('departmentId')
        .lean();
    if (!doctor)
        throw new error_middleware_1.AppError('Doctor not found', 404);
    const appointments = await models_1.Appointment.find({ doctorId: doctor._id })
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name' },
    })
        .sort({ appointmentDate: -1 })
        .limit(10)
        .lean();
    const schedules = await models_1.DoctorSchedule.find({ doctorId: doctor._id }).lean();
    const formatted = {
        ...doctor,
        id: doctor._id.toString(),
        user: doctor.userId,
        department: doctor.departmentId,
        appointments: appointments.map((a) => ({
            ...a,
            id: a._id.toString(),
            patient: a.patientId,
        })),
        schedules: schedules.map((s) => ({ ...s, id: s._id.toString() })),
    };
    res.json({ success: true, data: formatted });
});
exports.updateDoctorSchedule = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { availableDays, timeSlots, roomNumber, consultationFee, schedules } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new error_middleware_1.AppError('Invalid Doctor ID', 400);
    }
    // Only allow admin or the doctor himself
    if (req.user?.role !== 'ADMIN' && req.user?.doctorId !== id) {
        throw new error_middleware_1.AppError('Forbidden to update this doctor schedule', 403);
    }
    const updateFields = {};
    if (availableDays)
        updateFields.availableDays = availableDays;
    if (timeSlots)
        updateFields.timeSlots = timeSlots;
    if (roomNumber !== undefined)
        updateFields.roomNumber = roomNumber;
    if (consultationFee !== undefined)
        updateFields.consultationFee = Number(consultationFee);
    const updated = await models_1.Doctor.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
        .populate('userId', 'name email phone avatar')
        .populate('departmentId')
        .lean();
    if (!updated)
        throw new error_middleware_1.AppError('Doctor not found', 404);
    // If detailed weekly schedules were provided, sync them
    if (Array.isArray(schedules)) {
        await models_1.DoctorSchedule.deleteMany({ doctorId: updated._id });
        if (schedules.length > 0) {
            await models_1.DoctorSchedule.insertMany(schedules.map((s) => ({
                doctorId: updated._id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime || '09:00',
                endTime: s.endTime || '17:00',
                slotDurationMinutes: s.slotDurationMinutes || 30,
                maxPatientsPerSlot: s.maxPatientsPerSlot || 1,
                isAvailable: s.isAvailable !== false,
            })));
        }
    }
    res.json({
        success: true,
        message: 'Schedule updated successfully',
        data: {
            ...updated,
            id: updated._id.toString(),
            user: updated.userId,
            department: updated.departmentId,
        },
    });
});
exports.getDoctorPatients = (0, error_middleware_1.catchAsync)(async (req, res) => {
    let doctorId = req.user?.doctorId;
    if (!doctorId && req.user?.role !== 'ADMIN') {
        throw new error_middleware_1.AppError('Doctor profile required', 400);
    }
    if (req.user?.role === 'ADMIN' && req.query.doctorId) {
        doctorId = String(req.query.doctorId);
    }
    const appointmentQuery = {};
    if (doctorId && mongoose_1.default.Types.ObjectId.isValid(doctorId)) {
        appointmentQuery.doctorId = new mongoose_1.default.Types.ObjectId(doctorId);
    }
    const patientIds = await models_1.Appointment.find(appointmentQuery).distinct('patientId');
    const patients = await models_1.Patient.find({ _id: { $in: patientIds } })
        .populate('userId', 'name email phone avatar')
        .lean();
    const formattedPatients = await Promise.all(patients.map(async (p) => {
        const recentAppointments = await models_1.Appointment.find({
            patientId: p._id,
            ...(doctorId && mongoose_1.default.Types.ObjectId.isValid(doctorId)
                ? { doctorId: new mongoose_1.default.Types.ObjectId(doctorId) }
                : {}),
        })
            .sort({ appointmentDate: -1 })
            .limit(3)
            .lean();
        const recentPrescriptions = await models_1.Prescription.find({
            patientId: p._id,
            ...(doctorId && mongoose_1.default.Types.ObjectId.isValid(doctorId)
                ? { doctorId: new mongoose_1.default.Types.ObjectId(doctorId) }
                : {}),
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        return {
            ...p,
            id: p._id.toString(),
            user: p.userId,
            appointments: recentAppointments.map((a) => ({ ...a, id: a._id.toString() })),
            prescriptions: recentPrescriptions.map((pr) => ({ ...pr, id: pr._id.toString() })),
        };
    }));
    res.json({ success: true, count: formattedPatients.length, data: formattedPatients });
});
exports.getDoctorSchedules = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new error_middleware_1.AppError('Invalid Doctor ID', 400);
    }
    const schedules = await models_1.DoctorSchedule.find({ doctorId: id }).lean();
    res.json({
        success: true,
        data: schedules.map((s) => ({ ...s, id: s._id.toString() })),
    });
});
