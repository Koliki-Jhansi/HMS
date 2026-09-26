"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleAppointment = exports.updateAppointmentStatus = exports.createAppointment = exports.getAppointmentById = exports.getAppointments = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
const syncCounterWithExistingAppointments = async (counterName, currentYear) => {
    const existingCounter = await models_1.Counter.findOne({ name: counterName });
    if (!existingCounter) {
        const appointments = await models_1.Appointment.find({
            appointmentNumber: { $regex: `^APT-${currentYear}-` },
        }).select('appointmentNumber').lean();
        let maxSeq = 0;
        for (const apt of appointments) {
            const match = apt.appointmentNumber.match(/^APT-\d{4}-(\d+)/);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxSeq) {
                    maxSeq = num;
                }
            }
        }
        await models_1.Counter.findOneAndUpdate({ name: counterName }, { $setOnInsert: { seq: maxSeq } }, { upsert: true });
    }
};
const generateUniqueAppointmentNumber = async () => {
    const currentYear = new Date().getFullYear();
    const counterName = `appointmentNumber_${currentYear}`;
    await syncCounterWithExistingAppointments(counterName, currentYear);
    const counter = await models_1.Counter.findOneAndUpdate({ name: counterName }, { $inc: { seq: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    let seqNum = counter.seq;
    let appointmentNumber = `APT-${currentYear}-${String(seqNum).padStart(6, '0')}`;
    // Safeguard: verify no collision with existing records
    while (await models_1.Appointment.exists({ appointmentNumber })) {
        const updated = await models_1.Counter.findOneAndUpdate({ name: counterName }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        seqNum = updated.seq;
        appointmentNumber = `APT-${currentYear}-${String(seqNum).padStart(6, '0')}`;
    }
    return appointmentNumber;
};
exports.getAppointments = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { status, doctorId, patientId, departmentId, date, search } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
        query.status = String(status);
    }
    if (date) {
        query.appointmentDate = String(date);
    }
    if (departmentId && departmentId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(String(departmentId))) {
        query.departmentId = new mongoose_1.default.Types.ObjectId(String(departmentId));
    }
    // Role-based constraints
    if (req.user?.role === 'PATIENT' && req.user.patientId) {
        query.patientId = new mongoose_1.default.Types.ObjectId(req.user.patientId);
    }
    else if (req.user?.role === 'DOCTOR') {
        if (!doctorId && req.user.doctorId) {
            query.doctorId = new mongoose_1.default.Types.ObjectId(req.user.doctorId);
        }
        else if (doctorId && mongoose_1.default.Types.ObjectId.isValid(String(doctorId))) {
            query.doctorId = new mongoose_1.default.Types.ObjectId(String(doctorId));
        }
    }
    else {
        // ADMIN can filter by specific doctor or patient
        if (doctorId && doctorId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(String(doctorId))) {
            query.doctorId = new mongoose_1.default.Types.ObjectId(String(doctorId));
        }
        if (patientId && patientId !== 'ALL' && mongoose_1.default.Types.ObjectId.isValid(String(patientId))) {
            query.patientId = new mongoose_1.default.Types.ObjectId(String(patientId));
        }
    }
    let appointments = await models_1.Appointment.find(query)
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone avatar' },
    })
        .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name email phone avatar' }, { path: 'departmentId' }],
    })
        .populate('departmentId')
        .sort({ appointmentDate: -1, timeSlot: 1 })
        .lean();
    if (search) {
        const q = String(search).toLowerCase();
        appointments = appointments.filter((apt) => {
            const num = apt.appointmentNumber?.toLowerCase() || '';
            const reason = apt.reason?.toLowerCase() || '';
            const pName = apt.patientId?.userId?.name?.toLowerCase() || '';
            const dName = apt.doctorId?.userId?.name?.toLowerCase() || '';
            return num.includes(q) || reason.includes(q) || pName.includes(q) || dName.includes(q);
        });
    }
    const formatted = await Promise.all(appointments.map(async (apt) => {
        const prescription = await models_1.Prescription.findOne({ appointmentId: apt._id }).lean();
        return {
            ...apt,
            id: apt._id.toString(),
            patient: apt.patientId
                ? {
                    ...apt.patientId,
                    id: apt.patientId._id ? apt.patientId._id.toString() : apt.patientId.toString(),
                    user: apt.patientId.userId,
                }
                : null,
            doctor: apt.doctorId
                ? {
                    ...apt.doctorId,
                    id: apt.doctorId._id ? apt.doctorId._id.toString() : apt.doctorId.toString(),
                    user: apt.doctorId.userId,
                    department: apt.doctorId.departmentId,
                }
                : null,
            department: apt.departmentId
                ? {
                    ...apt.departmentId,
                    id: apt.departmentId._id ? apt.departmentId._id.toString() : apt.departmentId.toString(),
                }
                : null,
            prescription: prescription ? { ...prescription, id: prescription._id.toString() } : null,
        };
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
});
exports.getAppointmentById = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Appointment ID', 400);
    const appointment = await models_1.Appointment.findById(id)
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone avatar' },
    })
        .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name email phone avatar' }, { path: 'departmentId' }],
    })
        .populate('departmentId')
        .lean();
    if (!appointment)
        throw new error_middleware_1.AppError('Appointment not found', 404);
    // RBAC checks
    if (req.user?.role === 'PATIENT' && appointment.patientId?._id.toString() !== req.user.patientId) {
        throw new error_middleware_1.AppError('Forbidden: Not authorized to view this appointment', 403);
    }
    const prescription = await models_1.Prescription.findOne({ appointmentId: appointment._id }).lean();
    const formatted = {
        ...appointment,
        id: appointment._id.toString(),
        patient: appointment.patientId
            ? {
                ...appointment.patientId,
                id: appointment.patientId._id.toString(),
                user: appointment.patientId.userId,
            }
            : null,
        doctor: appointment.doctorId
            ? {
                ...appointment.doctorId,
                id: appointment.doctorId._id.toString(),
                user: appointment.doctorId.userId,
                department: appointment.doctorId.departmentId,
            }
            : null,
        department: appointment.departmentId,
        prescription: prescription ? { ...prescription, id: prescription._id.toString() } : null,
    };
    res.json({ success: true, data: formatted });
});
exports.createAppointment = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { doctorId, departmentId, appointmentDate, timeSlot, reason, symptoms } = req.body;
    let patientId = req.body.patientId;
    if (req.user?.role === 'PATIENT') {
        patientId = req.user.patientId;
    }
    if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
        throw new error_middleware_1.AppError('Valid Patient ID required', 400);
    }
    if (!doctorId || !mongoose_1.default.Types.ObjectId.isValid(doctorId) || !appointmentDate || !timeSlot || !reason) {
        throw new error_middleware_1.AppError('Valid Doctor, Date, Time slot, and Reason are required', 400);
    }
    const doctor = await models_1.Doctor.findById(doctorId).populate('userId');
    if (!doctor)
        throw new error_middleware_1.AppError('Doctor not found', 404);
    const patient = await models_1.Patient.findById(patientId).populate('userId');
    if (!patient)
        throw new error_middleware_1.AppError('Patient not found', 404);
    // Check for duplicate booking for same doctor, date and slot
    const existingSlot = await models_1.Appointment.findOne({
        doctorId: new mongoose_1.default.Types.ObjectId(doctorId),
        appointmentDate,
        timeSlot,
        status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
    });
    if (existingSlot) {
        throw new error_middleware_1.AppError('This time slot is already booked for this doctor. Please choose another time slot.', 400);
    }
    let apt = null;
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
        try {
            const appointmentNumber = await generateUniqueAppointmentNumber();
            apt = await models_1.Appointment.create({
                appointmentNumber,
                patientId: new mongoose_1.default.Types.ObjectId(patientId),
                doctorId: new mongoose_1.default.Types.ObjectId(doctorId),
                departmentId: departmentId && mongoose_1.default.Types.ObjectId.isValid(departmentId)
                    ? new mongoose_1.default.Types.ObjectId(departmentId)
                    : doctor.departmentId,
                appointmentDate,
                timeSlot,
                status: 'PENDING',
                reason,
                symptoms,
            });
            break;
        }
        catch (err) {
            if (err.code === 11000 && (err.keyPattern?.appointmentNumber || String(err.message).includes('appointmentNumber'))) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw new error_middleware_1.AppError('Unable to generate unique appointment number. Please try again.', 500);
                }
            }
            else {
                throw err;
            }
        }
    }
    if (!apt) {
        throw new error_middleware_1.AppError('Failed to create appointment record', 500);
    }
    // Notify doctor
    const docUser = doctor.userId;
    if (docUser) {
        const patientName = patient.userId?.name || 'A patient';
        await models_1.Notification.create({
            userId: docUser._id || docUser,
            title: 'New Appointment Booking',
            message: `${patientName} booked an appointment for ${appointmentDate} at ${timeSlot}.`,
            type: 'APPOINTMENT',
            link: '/doctor/appointments',
        });
    }
    const populated = await models_1.Appointment.findById(apt._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
        .populate('departmentId')
        .lean();
    res.status(201).json({
        success: true,
        message: 'Appointment booked successfully. Awaiting doctor confirmation.',
        data: {
            ...populated,
            id: populated?._id.toString(),
            patient: populated?.patientId,
            doctor: populated?.doctorId,
        },
    });
});
exports.updateAppointmentStatus = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { status, notes, rejectionReason, cancellationReason } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Appointment ID', 400);
    const validStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new error_middleware_1.AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    const appointment = await models_1.Appointment.findById(id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'doctorId', populate: { path: 'userId' } });
    if (!appointment)
        throw new error_middleware_1.AppError('Appointment not found', 404);
    // Role authorization
    if (req.user?.role === 'PATIENT') {
        const patientDocId = appointment.patientId._id.toString();
        if (patientDocId !== req.user.patientId)
            throw new error_middleware_1.AppError('Unauthorized', 403);
        if (status !== 'CANCELLED') {
            throw new error_middleware_1.AppError('Patients can only cancel appointments', 403);
        }
    }
    if (req.user?.role === 'DOCTOR') {
        const doctorDocId = appointment.doctorId._id.toString();
        if (doctorDocId !== req.user.doctorId)
            throw new error_middleware_1.AppError('Unauthorized for this appointment', 403);
    }
    appointment.status = status;
    if (notes !== undefined)
        appointment.notes = notes;
    if (rejectionReason !== undefined)
        appointment.rejectionReason = rejectionReason;
    if (cancellationReason !== undefined)
        appointment.cancellationReason = cancellationReason;
    await appointment.save();
    // Notify patient about status change
    const patientUser = appointment.patientId?.userId;
    const doctorUser = appointment.doctorId?.userId;
    const doctorName = doctorUser?.name || 'Doctor';
    if (patientUser) {
        let statusMessage = `Your appointment on ${appointment.appointmentDate} at ${appointment.timeSlot} with Dr. ${doctorName} is now ${status}.`;
        if (status === 'REJECTED' && rejectionReason) {
            statusMessage += ` Reason: ${rejectionReason}`;
        }
        await models_1.Notification.create({
            userId: patientUser._id || patientUser,
            title: `Appointment Status: ${status}`,
            message: statusMessage,
            type: 'APPOINTMENT',
            link: '/patient/appointments',
        });
    }
    const updatedPopulated = await models_1.Appointment.findById(appointment._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
        .populate('departmentId')
        .lean();
    res.json({
        success: true,
        message: `Appointment status updated to ${status}`,
        data: {
            ...updatedPopulated,
            id: updatedPopulated?._id.toString(),
            patient: updatedPopulated?.patientId,
            doctor: updatedPopulated?.doctorId,
        },
    });
});
exports.rescheduleAppointment = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { appointmentDate, timeSlot } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Appointment ID', 400);
    if (!appointmentDate || !timeSlot) {
        throw new error_middleware_1.AppError('New appointment date and time slot are required', 400);
    }
    const appointment = await models_1.Appointment.findById(id);
    if (!appointment)
        throw new error_middleware_1.AppError('Appointment not found', 404);
    // Check collision
    const collision = await models_1.Appointment.findOne({
        _id: { $ne: new mongoose_1.default.Types.ObjectId(id) },
        doctorId: appointment.doctorId,
        appointmentDate,
        timeSlot,
        status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
    });
    if (collision) {
        throw new error_middleware_1.AppError('Selected time slot is already booked for this doctor', 400);
    }
    appointment.appointmentDate = appointmentDate;
    appointment.timeSlot = timeSlot;
    appointment.status = 'PENDING'; // Reset to pending for doctor confirmation
    await appointment.save();
    const updatedPopulated = await models_1.Appointment.findById(appointment._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
        .lean();
    res.json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: {
            ...updatedPopulated,
            id: updatedPopulated?._id.toString(),
            patient: updatedPopulated?.patientId,
            doctor: updatedPopulated?.doctorId,
        },
    });
});
