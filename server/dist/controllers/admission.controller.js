"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferBed = exports.dischargePatient = exports.createAdmission = exports.getAdmissionById = exports.getAdmissions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getAdmissions = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { status, patientId, doctorId, search } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
        query.status = String(status);
    }
    if (patientId && mongoose_1.default.Types.ObjectId.isValid(String(patientId))) {
        query.patientId = new mongoose_1.default.Types.ObjectId(String(patientId));
    }
    else if (req.user?.role === 'PATIENT' && req.user.patientId) {
        query.patientId = new mongoose_1.default.Types.ObjectId(req.user.patientId);
    }
    if (doctorId && mongoose_1.default.Types.ObjectId.isValid(String(doctorId))) {
        query.admittingDoctorId = new mongoose_1.default.Types.ObjectId(String(doctorId));
    }
    else if (req.user?.role === 'DOCTOR' && req.user.doctorId) {
        query.admittingDoctorId = new mongoose_1.default.Types.ObjectId(req.user.doctorId);
    }
    let admissions = await models_1.Admission.find(query)
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone avatar' },
    })
        .populate({
        path: 'bedId',
        populate: { path: 'wardId' },
    })
        .populate({
        path: 'admittingDoctorId',
        populate: [{ path: 'userId', select: 'name email phone' }, { path: 'departmentId' }],
    })
        .sort({ admissionDate: -1 })
        .lean();
    if (search) {
        const q = String(search).toLowerCase();
        admissions = admissions.filter((adm) => {
            const num = adm.admissionNumber?.toLowerCase() || '';
            const reason = adm.reason?.toLowerCase() || '';
            const diag = adm.diagnosis?.toLowerCase() || '';
            const pName = adm.patientId?.userId?.name?.toLowerCase() || '';
            const mrn = adm.patientId?.medicalRecordNumber?.toLowerCase() || '';
            return num.includes(q) || reason.includes(q) || diag.includes(q) || pName.includes(q) || mrn.includes(q);
        });
    }
    const formatted = admissions.map((adm) => ({
        ...adm,
        id: adm._id.toString(),
        patient: adm.patientId
            ? {
                ...adm.patientId,
                id: adm.patientId._id ? adm.patientId._id.toString() : adm.patientId.toString(),
                user: adm.patientId.userId,
            }
            : null,
        bed: adm.bedId
            ? {
                ...adm.bedId,
                id: adm.bedId._id ? adm.bedId._id.toString() : adm.bedId.toString(),
                ward: adm.bedId.wardId,
            }
            : null,
        doctor: adm.admittingDoctorId
            ? {
                ...adm.admittingDoctorId,
                id: adm.admittingDoctorId._id ? adm.admittingDoctorId._id.toString() : adm.admittingDoctorId.toString(),
                user: adm.admittingDoctorId.userId,
                department: adm.admittingDoctorId.departmentId,
            }
            : null,
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
});
exports.getAdmissionById = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Admission ID', 400);
    const admission = await models_1.Admission.findById(id)
        .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone avatar' },
    })
        .populate({
        path: 'bedId',
        populate: { path: 'wardId' },
    })
        .populate({
        path: 'admittingDoctorId',
        populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }],
    })
        .lean();
    if (!admission)
        throw new error_middleware_1.AppError('Admission record not found', 404);
    const formatted = {
        ...admission,
        id: admission._id.toString(),
        patient: admission.patientId
            ? {
                ...admission.patientId,
                id: admission.patientId._id.toString(),
                user: admission.patientId.userId,
            }
            : null,
        bed: admission.bedId
            ? {
                ...admission.bedId,
                id: admission.bedId._id.toString(),
                ward: admission.bedId.wardId,
            }
            : null,
        doctor: admission.admittingDoctorId
            ? {
                ...admission.admittingDoctorId,
                id: admission.admittingDoctorId._id.toString(),
                user: admission.admittingDoctorId.userId,
            }
            : null,
    };
    res.json({ success: true, data: formatted });
});
exports.createAdmission = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { patientId, bedId, admittingDoctorId, reason, diagnosis, notes } = req.body;
    if (!patientId || !bedId || !admittingDoctorId || !reason) {
        throw new error_middleware_1.AppError('Patient, Bed, Doctor, and Reason for admission are required', 400);
    }
    // Check if patient is already actively admitted
    const existingActive = await models_1.Admission.findOne({
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
        status: 'ACTIVE',
    });
    if (existingActive) {
        throw new error_middleware_1.AppError('Patient is already actively admitted in a ward', 400);
    }
    // Check bed availability
    const bed = await models_1.Bed.findById(bedId).populate('wardId');
    if (!bed)
        throw new error_middleware_1.AppError('Selected bed not found', 404);
    if (bed.status !== 'AVAILABLE') {
        throw new error_middleware_1.AppError(`Bed ${bed.bedNumber} is currently ${bed.status}. Please choose an Available bed.`, 400);
    }
    const patient = await models_1.Patient.findById(patientId).populate('userId');
    if (!patient)
        throw new error_middleware_1.AppError('Patient not found', 404);
    const doctor = await models_1.Doctor.findById(admittingDoctorId).populate('userId');
    if (!doctor)
        throw new error_middleware_1.AppError('Doctor not found', 404);
    const admissionCount = await models_1.Admission.countDocuments();
    const admissionNumber = `ADM-2026-${(1001 + admissionCount).toString()}`;
    // 1. Create admission record
    const admission = await models_1.Admission.create({
        admissionNumber,
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
        bedId: new mongoose_1.default.Types.ObjectId(bedId),
        admittingDoctorId: new mongoose_1.default.Types.ObjectId(admittingDoctorId),
        admissionDate: new Date(),
        reason,
        diagnosis,
        status: 'ACTIVE',
    });
    // 2. Automatically mark assigned bed as OCCUPIED
    await models_1.Bed.findByIdAndUpdate(bedId, { $set: { status: 'OCCUPIED' } });
    // 3. Send notification to patient
    if (patient.userId) {
        await models_1.Notification.create({
            userId: patient.userId._id || patient.userId,
            title: 'Hospital Admission Confirmed',
            message: `You have been admitted to ${bed.wardId?.name || 'Ward'}, Bed ${bed.bedNumber} under Dr. ${doctor.userId?.name || 'Physician'}.`,
            type: 'ADMISSION',
            link: '/patient/bed-admission',
        });
    }
    // 4. Send notification to admitting doctor
    if (doctor.userId) {
        await models_1.Notification.create({
            userId: doctor.userId._id || doctor.userId,
            title: 'New Inpatient Assigned',
            message: `Patient ${patient.userId?.name || 'Patient'} admitted to ${bed.wardId?.name || 'Ward'} Bed ${bed.bedNumber}.`,
            type: 'ADMISSION',
            link: '/doctor/patients',
        });
    }
    const populated = await models_1.Admission.findById(admission._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'bedId', populate: { path: 'wardId' } })
        .populate({ path: 'admittingDoctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
        .lean();
    res.status(201).json({
        success: true,
        message: `Patient admitted successfully to bed ${bed.bedNumber}`,
        data: {
            ...populated,
            id: populated?._id.toString(),
            patient: populated?.patientId,
            bed: populated?.bedId,
            doctor: populated?.admittingDoctorId,
        },
    });
});
exports.dischargePatient = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { dischargeSummary, postDischargeBedStatus = 'CLEANING', totalBill } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Admission ID', 400);
    const admission = await models_1.Admission.findById(id)
        .populate({ path: 'bedId', populate: { path: 'wardId' } })
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'admittingDoctorId', populate: { path: 'userId' } });
    if (!admission)
        throw new error_middleware_1.AppError('Admission record not found', 404);
    if (admission.status === 'DISCHARGED') {
        throw new error_middleware_1.AppError('Patient is already discharged', 400);
    }
    const dischargeDate = new Date();
    const bedDoc = admission.bedId;
    const dailyRate = bedDoc?.dailyRate || 100;
    // Calculate bill if not provided
    const daysStayed = Math.max(1, Math.ceil((dischargeDate.getTime() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24)));
    const calculatedBill = totalBill !== undefined ? Number(totalBill) : daysStayed * dailyRate;
    // 1. Update admission status
    admission.status = 'DISCHARGED';
    admission.dischargeDate = dischargeDate;
    admission.dischargeSummary = dischargeSummary || 'Patient discharged in stable and recovering condition.';
    admission.totalBill = calculatedBill;
    await admission.save();
    // 2. Automatically update bed status
    const validPostStatuses = ['CLEANING', 'AVAILABLE', 'MAINTENANCE'];
    const newBedStatus = validPostStatuses.includes(postDischargeBedStatus) ? postDischargeBedStatus : 'CLEANING';
    await models_1.Bed.findByIdAndUpdate(bedDoc._id, { $set: { status: newBedStatus } });
    // 3. Create medical record for discharge summary
    await models_1.MedicalRecord.create({
        recordNumber: `REC-DIS-${Date.now().toString().slice(-4)}`,
        patientId: admission.patientId._id,
        doctorId: admission.admittingDoctorId._id,
        title: `Discharge Summary: ${admission.reason}`,
        recordType: 'DISCHARGE_SUMMARY',
        notes: dischargeSummary || `Discharged on ${dischargeDate.toLocaleDateString()}. Total stay: ${daysStayed} day(s). Final bill: $${calculatedBill}.`,
        recordDate: dischargeDate.toISOString().split('T')[0],
    });
    // 4. Notify patient
    const patientUser = admission.patientId?.userId;
    if (patientUser) {
        await models_1.Notification.create({
            userId: patientUser._id || patientUser,
            title: 'Hospital Discharge Completed',
            message: `You have been officially discharged. Total hospital stay: ${daysStayed} day(s).`,
            type: 'ADMISSION',
            link: '/patient/medical-records',
        });
    }
    const updatedPopulated = await models_1.Admission.findById(admission._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'bedId', populate: { path: 'wardId' } })
        .populate({ path: 'admittingDoctorId', populate: { path: 'userId' } })
        .lean();
    const patientName = patientUser?.name || 'Patient';
    const bedNumber = bedDoc?.bedNumber || '';
    res.json({
        success: true,
        message: `Patient ${patientName} discharged successfully. Bed ${bedNumber} marked as ${newBedStatus}.`,
        data: {
            ...updatedPopulated,
            id: updatedPopulated?._id.toString(),
            patient: updatedPopulated?.patientId,
            bed: updatedPopulated?.bedId,
            doctor: updatedPopulated?.admittingDoctorId,
        },
    });
});
exports.transferBed = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { newBedId, notes } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Admission ID', 400);
    if (!mongoose_1.default.Types.ObjectId.isValid(newBedId))
        throw new error_middleware_1.AppError('Invalid Destination Bed ID', 400);
    const admission = await models_1.Admission.findById(id)
        .populate('bedId')
        .populate({ path: 'patientId', populate: { path: 'userId' } });
    if (!admission)
        throw new error_middleware_1.AppError('Admission record not found', 404);
    if (admission.status !== 'ACTIVE')
        throw new error_middleware_1.AppError('Only active admissions can be transferred', 400);
    const newBed = await models_1.Bed.findById(newBedId).populate('wardId');
    if (!newBed)
        throw new error_middleware_1.AppError('Destination bed not found', 404);
    if (newBed.status !== 'AVAILABLE') {
        throw new error_middleware_1.AppError(`Destination bed ${newBed.bedNumber} is ${newBed.status}, not AVAILABLE`, 400);
    }
    const oldBedId = admission.bedId._id;
    // Free previous bed
    await models_1.Bed.findByIdAndUpdate(oldBedId, { $set: { status: 'CLEANING' } });
    // Occupy new bed
    await models_1.Bed.findByIdAndUpdate(newBedId, { $set: { status: 'OCCUPIED' } });
    // Update admission bed
    admission.bedId = newBed._id;
    await admission.save();
    // Notify patient
    const patientUser = admission.patientId?.userId;
    if (patientUser) {
        const wardName = newBed.wardId?.name || 'Ward';
        await models_1.Notification.create({
            userId: patientUser._id || patientUser,
            title: 'Bed Transfer Completed',
            message: `You have been transferred to ${wardName}, Bed ${newBed.bedNumber}.`,
            type: 'BED',
            link: '/patient/bed-admission',
        });
    }
    const updatedPopulated = await models_1.Admission.findById(admission._id)
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'bedId', populate: { path: 'wardId' } })
        .populate({ path: 'admittingDoctorId', populate: { path: 'userId' } })
        .lean();
    const wardName = newBed.wardId?.name || 'Ward';
    res.json({
        success: true,
        message: `Patient successfully transferred to ${wardName} Bed ${newBed.bedNumber}`,
        data: {
            ...updatedPopulated,
            id: updatedPopulated?._id.toString(),
            patient: updatedPopulated?.patientId,
            bed: updatedPopulated?.bedId,
            doctor: updatedPopulated?.admittingDoctorId,
        },
    });
});
