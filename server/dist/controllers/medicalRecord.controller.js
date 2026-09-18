"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMedicalRecord = exports.getMedicalRecords = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getMedicalRecords = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { patientId, doctorId, recordType, search } = req.query;
    const query = {};
    if (req.user?.role === 'PATIENT' && req.user.patientId) {
        query.patientId = new mongoose_1.default.Types.ObjectId(req.user.patientId);
    }
    else if (patientId && mongoose_1.default.Types.ObjectId.isValid(String(patientId))) {
        query.patientId = new mongoose_1.default.Types.ObjectId(String(patientId));
    }
    if (doctorId && mongoose_1.default.Types.ObjectId.isValid(String(doctorId))) {
        query.doctorId = new mongoose_1.default.Types.ObjectId(String(doctorId));
    }
    if (recordType && recordType !== 'ALL') {
        query.recordType = String(recordType);
    }
    let records = await models_1.MedicalRecord.find(query)
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone avatar' },
    })
        .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name email phone' }, { path: 'departmentId' }],
    })
        .sort({ recordDate: -1, createdAt: -1 })
        .lean();
    if (search) {
        const q = String(search).toLowerCase();
        records = records.filter((r) => {
            const num = r.recordNumber?.toLowerCase() || '';
            const title = r.title?.toLowerCase() || '';
            const notes = r.notes?.toLowerCase() || '';
            const pName = r.patientId?.userId?.name?.toLowerCase() || '';
            return num.includes(q) || title.includes(q) || notes.includes(q) || pName.includes(q);
        });
    }
    const formatted = records.map((r) => ({
        ...r,
        id: r._id.toString(),
        patient: r.patientId
            ? {
                ...r.patientId,
                id: r.patientId._id ? r.patientId._id.toString() : r.patientId.toString(),
                user: r.patientId.userId,
            }
            : null,
        doctor: r.doctorId
            ? {
                ...r.doctorId,
                id: r.doctorId._id ? r.doctorId._id.toString() : r.doctorId.toString(),
                user: r.doctorId.userId,
                department: r.doctorId.departmentId,
            }
            : null,
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
});
exports.createMedicalRecord = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { patientId, title, recordType, notes, attachments, recordDate } = req.body;
    let doctorId = req.body.doctorId;
    if (req.user?.role === 'DOCTOR') {
        doctorId = req.user.doctorId;
    }
    if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId) || !title || !notes) {
        throw new error_middleware_1.AppError('Valid Patient ID, Title, and Clinical Notes are required', 400);
    }
    const patient = await models_1.Patient.findById(patientId).populate('userId');
    if (!patient)
        throw new error_middleware_1.AppError('Patient not found', 404);
    const recCount = await models_1.MedicalRecord.countDocuments();
    const recordNumber = `REC-2026-${(100 + recCount + 1).toString()}`;
    const record = await models_1.MedicalRecord.create({
        recordNumber,
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
        doctorId: doctorId && mongoose_1.default.Types.ObjectId.isValid(doctorId)
            ? new mongoose_1.default.Types.ObjectId(doctorId)
            : undefined,
        title,
        recordType: recordType || 'CONSULTATION',
        notes,
        attachments: attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null,
        recordDate: recordDate || new Date().toISOString().split('T')[0],
    });
    // Notify patient
    const patientUser = patient.userId;
    if (patientUser) {
        await models_1.Notification.create({
            userId: patientUser._id || patientUser,
            title: 'New Medical Record Added',
            message: `A new ${recordType || 'clinical'} report "${title}" was appended to your health history.`,
            type: 'SYSTEM',
            link: '/patient/medical-records',
        });
    }
    const populated = await models_1.MedicalRecord.findById(record._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'doctorId', populate: { path: 'userId' } })
        .lean();
    res.status(201).json({
        success: true,
        message: 'Medical record documented successfully',
        data: {
            ...populated,
            id: populated?._id.toString(),
            patient: populated?.patientId,
            doctor: populated?.doctorId,
        },
    });
});
