"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrescription = exports.getPrescriptionById = exports.getPrescriptions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getPrescriptions = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { patientId, doctorId, appointmentId, search } = req.query;
    const query = {};
    if (req.user?.role === 'PATIENT' && req.user.patientId) {
        query.patientId = new mongoose_1.default.Types.ObjectId(req.user.patientId);
    }
    else if (req.user?.role === 'DOCTOR') {
        if (patientId && mongoose_1.default.Types.ObjectId.isValid(String(patientId))) {
            query.patientId = new mongoose_1.default.Types.ObjectId(String(patientId));
        }
        else if (req.user.doctorId) {
            query.doctorId = new mongoose_1.default.Types.ObjectId(req.user.doctorId);
        }
    }
    else {
        // Admin
        if (patientId && mongoose_1.default.Types.ObjectId.isValid(String(patientId))) {
            query.patientId = new mongoose_1.default.Types.ObjectId(String(patientId));
        }
        if (doctorId && mongoose_1.default.Types.ObjectId.isValid(String(doctorId))) {
            query.doctorId = new mongoose_1.default.Types.ObjectId(String(doctorId));
        }
    }
    if (appointmentId && mongoose_1.default.Types.ObjectId.isValid(String(appointmentId))) {
        query.appointmentId = new mongoose_1.default.Types.ObjectId(String(appointmentId));
    }
    let prescriptions = await models_1.Prescription.find(query)
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone avatar' },
    })
        .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name email phone' }, { path: 'departmentId' }],
    })
        .populate('appointmentId')
        .sort({ createdAt: -1 })
        .lean();
    if (search) {
        const q = String(search).toLowerCase();
        prescriptions = prescriptions.filter((pr) => {
            const num = pr.prescriptionNumber?.toLowerCase() || '';
            const diag = pr.diagnosis?.toLowerCase() || '';
            const pName = pr.patientId?.userId?.name?.toLowerCase() || '';
            const dName = pr.doctorId?.userId?.name?.toLowerCase() || '';
            return num.includes(q) || diag.includes(q) || pName.includes(q) || dName.includes(q);
        });
    }
    const formatted = prescriptions.map((pr) => ({
        ...pr,
        id: pr._id.toString(),
        patient: pr.patientId
            ? {
                ...pr.patientId,
                id: pr.patientId._id ? pr.patientId._id.toString() : pr.patientId.toString(),
                user: pr.patientId.userId,
            }
            : null,
        doctor: pr.doctorId
            ? {
                ...pr.doctorId,
                id: pr.doctorId._id ? pr.doctorId._id.toString() : pr.doctorId.toString(),
                user: pr.doctorId.userId,
                department: pr.doctorId.departmentId,
            }
            : null,
        appointment: pr.appointmentId
            ? {
                ...pr.appointmentId,
                id: pr.appointmentId._id ? pr.appointmentId._id.toString() : pr.appointmentId.toString(),
            }
            : null,
        items: (pr.items || []).map((item) => ({
            ...item,
            id: item._id ? item._id.toString() : item.id,
        })),
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
});
exports.getPrescriptionById = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Prescription ID', 400);
    const prescription = await models_1.Prescription.findById(id)
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone avatar' },
    })
        .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name email phone' }, { path: 'departmentId' }],
    })
        .populate('appointmentId')
        .lean();
    if (!prescription)
        throw new error_middleware_1.AppError('Prescription not found', 404);
    const patientIdStr = prescription.patientId?._id?.toString() || prescription.patientId?.toString();
    if (req.user?.role === 'PATIENT' && req.user.patientId !== patientIdStr) {
        throw new error_middleware_1.AppError('Forbidden: Access denied to this prescription', 403);
    }
    const formatted = {
        ...prescription,
        id: prescription._id.toString(),
        patient: prescription.patientId
            ? {
                ...prescription.patientId,
                id: prescription.patientId._id?.toString(),
                user: prescription.patientId.userId,
            }
            : null,
        doctor: prescription.doctorId
            ? {
                ...prescription.doctorId,
                id: prescription.doctorId._id?.toString(),
                user: prescription.doctorId.userId,
                department: prescription.doctorId.departmentId,
            }
            : null,
        appointment: prescription.appointmentId,
        items: (prescription.items || []).map((item) => ({
            ...item,
            id: item._id ? item._id.toString() : item.id,
        })),
    };
    res.json({ success: true, data: formatted });
});
exports.createPrescription = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { appointmentId, patientId, diagnosis, notes, followUpDate, items } = req.body;
    let doctorId = req.body.doctorId;
    if (req.user?.role === 'DOCTOR') {
        doctorId = req.user.doctorId;
    }
    if (!doctorId || !mongoose_1.default.Types.ObjectId.isValid(doctorId)) {
        throw new error_middleware_1.AppError('Valid Doctor ID required', 400);
    }
    if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId) || !diagnosis) {
        throw new error_middleware_1.AppError('Valid Patient ID and Clinical Diagnosis are required', 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new error_middleware_1.AppError('At least one prescription medicine item is required', 400);
    }
    const patient = await models_1.Patient.findById(patientId).populate('userId');
    if (!patient)
        throw new error_middleware_1.AppError('Patient not found', 404);
    const doctor = await models_1.Doctor.findById(doctorId).populate('userId');
    if (!doctor)
        throw new error_middleware_1.AppError('Doctor not found', 404);
    const prescCount = await models_1.Prescription.countDocuments();
    const prescriptionNumber = `RX-2026-${(8800 + prescCount + 1).toString()}`;
    // 1. Create prescription
    const prescription = await models_1.Prescription.create({
        prescriptionNumber,
        appointmentId: appointmentId && mongoose_1.default.Types.ObjectId.isValid(appointmentId)
            ? new mongoose_1.default.Types.ObjectId(appointmentId)
            : undefined,
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
        doctorId: new mongoose_1.default.Types.ObjectId(doctorId),
        diagnosis,
        notes,
        followUpDate,
        items: items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route || 'Oral',
            instructions: item.instructions || 'Take as directed',
        })),
    });
    // 2. Also record in MedicalRecord for EHR completeness
    await models_1.MedicalRecord.create({
        recordNumber: `REC-RX-${Date.now().toString().slice(-4)}`,
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
        doctorId: new mongoose_1.default.Types.ObjectId(doctorId),
        title: `Prescription: ${diagnosis}`,
        recordType: 'CONSULTATION',
        notes: `Prescribed ${items.length} medication(s). Follow-up scheduled: ${followUpDate || 'None specified'}. Clinical Notes: ${notes || 'N/A'}`,
        recordDate: new Date().toISOString().split('T')[0],
    });
    // 3. Update appointment to COMPLETED if linked
    if (appointmentId && mongoose_1.default.Types.ObjectId.isValid(appointmentId)) {
        await models_1.Appointment.findByIdAndUpdate(appointmentId, { $set: { status: 'COMPLETED' } });
    }
    // 4. Notify patient
    const patientUser = patient.userId;
    if (patientUser) {
        const doctorName = doctor.userId?.name || 'Doctor';
        await models_1.Notification.create({
            userId: patientUser._id || patientUser,
            title: 'New Prescription Issued',
            message: `Dr. ${doctorName} issued prescription ${prescriptionNumber} with ${items.length} medication(s).`,
            type: 'PRESCRIPTION',
            link: '/patient/prescriptions',
        });
    }
    const populated = await models_1.Prescription.findById(prescription._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
        .populate('appointmentId')
        .lean();
    res.status(201).json({
        success: true,
        message: 'Prescription generated successfully',
        data: {
            ...populated,
            id: populated?._id.toString(),
            patient: populated?.patientId,
            doctor: populated?.doctorId,
            items: (populated?.items || []).map((item) => ({
                ...item,
                id: item._id ? item._id.toString() : item.id,
            })),
        },
    });
});
