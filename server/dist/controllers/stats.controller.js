"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getDashboardStats = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const role = req.user?.role;
    const userId = req.user?.id;
    if (role === 'ADMIN') {
        const [totalPatients, totalDoctors, totalDepartments, totalBeds, occupiedBeds, availableBeds, cleaningBeds, maintenanceBeds, reservedBeds, totalAdmissions, activeAdmissions, totalAppointments, pendingAppointments, completedAppointments,] = await Promise.all([
            models_1.Patient.countDocuments(),
            models_1.Doctor.countDocuments(),
            models_1.Department.countDocuments(),
            models_1.Bed.countDocuments(),
            models_1.Bed.countDocuments({ status: 'OCCUPIED' }),
            models_1.Bed.countDocuments({ status: 'AVAILABLE' }),
            models_1.Bed.countDocuments({ status: 'CLEANING' }),
            models_1.Bed.countDocuments({ status: 'MAINTENANCE' }),
            models_1.Bed.countDocuments({ status: 'RESERVED' }),
            models_1.Admission.countDocuments(),
            models_1.Admission.countDocuments({ status: 'ACTIVE' }),
            models_1.Appointment.countDocuments(),
            models_1.Appointment.countDocuments({ status: 'PENDING' }),
            models_1.Appointment.countDocuments({ status: 'COMPLETED' }),
        ]);
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = await models_1.Appointment.countDocuments({ appointmentDate: today });
        const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
        // Recent activity list
        const recentAppointments = await models_1.Appointment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email avatar' } })
            .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }] })
            .lean();
        const recentAdmissions = await models_1.Admission.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
            .populate({ path: 'bedId', populate: { path: 'wardId' } })
            .populate({ path: 'admittingDoctorId', populate: { path: 'userId', select: 'name' } })
            .lean();
        const wards = await models_1.Ward.find().lean();
        const wardStats = await Promise.all(wards.map(async (w) => {
            const beds = await models_1.Bed.find({ wardId: w._id }).lean();
            return {
                id: w._id.toString(),
                name: w.name,
                code: w.code,
                type: w.type,
                floor: w.floor,
                totalBeds: beds.length,
                available: beds.filter((b) => b.status === 'AVAILABLE').length,
                occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
                reserved: beds.filter((b) => b.status === 'RESERVED').length,
                cleaning: beds.filter((b) => b.status === 'CLEANING').length,
            };
        }));
        return res.json({
            success: true,
            data: {
                overview: {
                    totalPatients,
                    totalDoctors,
                    totalDepartments,
                    totalBeds,
                    occupiedBeds,
                    availableBeds,
                    cleaningBeds,
                    maintenanceBeds,
                    reservedBeds,
                    bedOccupancyRate,
                    activeAdmissions,
                    totalAdmissions,
                    totalAppointments,
                    todayAppointments,
                    pendingAppointments,
                    completedAppointments,
                },
                wardStats,
                recentAppointments: recentAppointments.map((a) => ({
                    ...a,
                    id: a._id.toString(),
                    patient: a.patientId,
                    doctor: a.doctorId,
                })),
                recentAdmissions: recentAdmissions.map((adm) => ({
                    ...adm,
                    id: adm._id.toString(),
                    patient: adm.patientId,
                    bed: adm.bedId,
                    doctor: adm.admittingDoctorId,
                })),
            },
        });
    }
    if (role === 'DOCTOR') {
        const doctor = await models_1.Doctor.findOne({ userId: new mongoose_1.default.Types.ObjectId(userId) });
        if (!doctor)
            throw new error_middleware_1.AppError('Doctor record not found', 404);
        const today = new Date().toISOString().split('T')[0];
        const [todayAppointments, pendingRequests, inProgressCount, completedTotal, totalPrescriptions, activeAdmittedPatients,] = await Promise.all([
            models_1.Appointment.countDocuments({ doctorId: doctor._id, appointmentDate: today }),
            models_1.Appointment.countDocuments({ doctorId: doctor._id, status: 'PENDING' }),
            models_1.Appointment.countDocuments({ doctorId: doctor._id, status: 'IN_PROGRESS' }),
            models_1.Appointment.countDocuments({ doctorId: doctor._id, status: 'COMPLETED' }),
            models_1.Prescription.countDocuments({ doctorId: doctor._id }),
            models_1.Admission.countDocuments({ admittingDoctorId: doctor._id, status: 'ACTIVE' }),
        ]);
        // Today's schedule
        const todaySchedule = await models_1.Appointment.find({ doctorId: doctor._id, appointmentDate: today })
            .sort({ timeSlot: 1 })
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone avatar' } })
            .lean();
        // Pending requests
        const pendingAppointments = await models_1.Appointment.find({ doctorId: doctor._id, status: 'PENDING' })
            .sort({ appointmentDate: 1 })
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone avatar' } })
            .lean();
        return res.json({
            success: true,
            data: {
                stats: {
                    todayAppointments,
                    pendingRequests,
                    inProgressCount,
                    completedTotal,
                    totalPrescriptions,
                    activeAdmittedPatients,
                },
                todaySchedule: todaySchedule.map((a) => ({
                    ...a,
                    id: a._id.toString(),
                    patient: a.patientId,
                })),
                pendingAppointments: pendingAppointments.map((a) => ({
                    ...a,
                    id: a._id.toString(),
                    patient: a.patientId,
                })),
            },
        });
    }
    if (role === 'PATIENT') {
        const patient = await models_1.Patient.findOne({ userId: new mongoose_1.default.Types.ObjectId(userId) });
        if (!patient)
            throw new error_middleware_1.AppError('Patient profile not found', 404);
        const upcomingAppointments = await models_1.Appointment.find({
            patientId: patient._id,
            status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
        })
            .sort({ appointmentDate: 1 })
            .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name phone avatar' }, { path: 'departmentId' }] })
            .lean();
        const activeAdmission = await models_1.Admission.findOne({ patientId: patient._id, status: 'ACTIVE' })
            .populate({ path: 'bedId', populate: { path: 'wardId' } })
            .populate({ path: 'admittingDoctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }] })
            .lean();
        const prescriptions = await models_1.Prescription.find({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }] })
            .lean();
        const medicalRecords = await models_1.MedicalRecord.find({ patientId: patient._id })
            .sort({ recordDate: -1 })
            .limit(5)
            .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
            .lean();
        const totalCompletedAppointments = await models_1.Appointment.countDocuments({
            patientId: patient._id,
            status: 'COMPLETED',
        });
        return res.json({
            success: true,
            data: {
                upcomingAppointments: upcomingAppointments.map((a) => ({
                    ...a,
                    id: a._id.toString(),
                    doctor: a.doctorId,
                })),
                activeAdmission: activeAdmission
                    ? {
                        ...activeAdmission,
                        id: activeAdmission._id.toString(),
                        bed: activeAdmission.bedId,
                        doctor: activeAdmission.admittingDoctorId,
                    }
                    : null,
                prescriptions: prescriptions.map((p) => ({
                    ...p,
                    id: p._id.toString(),
                    doctor: p.doctorId,
                })),
                medicalRecords: medicalRecords.map((m) => ({
                    ...m,
                    id: m._id.toString(),
                    doctor: m.doctorId,
                })),
                stats: {
                    upcomingCount: upcomingAppointments.length,
                    prescriptionsCount: prescriptions.length,
                    recordsCount: medicalRecords.length,
                    completedCount: totalCompletedAppointments,
                    isAdmitted: !!activeAdmission,
                },
            },
        });
    }
    res.json({ success: true, data: {} });
});
