import { Response } from 'express';
import mongoose from 'mongoose';
import {
  Patient,
  Doctor,
  Department,
  Bed,
  Ward,
  Admission,
  Appointment,
  Prescription,
  MedicalRecord,
} from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getDashboardStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  const userId = req.user?.id;

  if (role === 'ADMIN') {
    const [
      totalPatients,
      totalDoctors,
      totalDepartments,
      totalBeds,
      occupiedBeds,
      availableBeds,
      cleaningBeds,
      maintenanceBeds,
      reservedBeds,
      totalAdmissions,
      activeAdmissions,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Department.countDocuments(),
      Bed.countDocuments(),
      Bed.countDocuments({ status: 'OCCUPIED' }),
      Bed.countDocuments({ status: 'AVAILABLE' }),
      Bed.countDocuments({ status: 'CLEANING' }),
      Bed.countDocuments({ status: 'MAINTENANCE' }),
      Bed.countDocuments({ status: 'RESERVED' }),
      Admission.countDocuments(),
      Admission.countDocuments({ status: 'ACTIVE' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'PENDING' }),
      Appointment.countDocuments({ status: 'COMPLETED' }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await Appointment.countDocuments({ appointmentDate: today });
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Recent activity list
    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email avatar' } })
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }] })
      .lean();

    const recentAdmissions = await Admission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
      .populate({ path: 'bedId', populate: { path: 'wardId' } })
      .populate({ path: 'admittingDoctorId', populate: { path: 'userId', select: 'name' } })
      .lean();

    const wards = await Ward.find().lean();
    const wardStats = await Promise.all(
      wards.map(async (w: any) => {
        const beds = await Bed.find({ wardId: w._id }).lean();
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
      })
    );

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
        recentAppointments: recentAppointments.map((a: any) => ({
          ...a,
          id: a._id.toString(),
          patient: a.patientId,
          doctor: a.doctorId,
        })),
        recentAdmissions: recentAdmissions.map((adm: any) => ({
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
    const doctor = await Doctor.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!doctor) throw new AppError('Doctor record not found', 404);

    const today = new Date().toISOString().split('T')[0];

    const [
      todayAppointments,
      pendingRequests,
      inProgressCount,
      completedTotal,
      totalPrescriptions,
      activeAdmittedPatients,
    ] = await Promise.all([
      Appointment.countDocuments({ doctorId: doctor._id, appointmentDate: today }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'PENDING' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'IN_PROGRESS' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'COMPLETED' }),
      Prescription.countDocuments({ doctorId: doctor._id }),
      Admission.countDocuments({ admittingDoctorId: doctor._id, status: 'ACTIVE' }),
    ]);

    // Today's schedule
    const todaySchedule = await Appointment.find({ doctorId: doctor._id, appointmentDate: today })
      .sort({ timeSlot: 1 })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone avatar' } })
      .lean();

    // Pending requests
    const pendingAppointments = await Appointment.find({ doctorId: doctor._id, status: 'PENDING' })
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
        todaySchedule: todaySchedule.map((a: any) => ({
          ...a,
          id: a._id.toString(),
          patient: a.patientId,
        })),
        pendingAppointments: pendingAppointments.map((a: any) => ({
          ...a,
          id: a._id.toString(),
          patient: a.patientId,
        })),
      },
    });
  }

  if (role === 'PATIENT') {
    const patient = await Patient.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!patient) throw new AppError('Patient profile not found', 404);

    const upcomingAppointments = await Appointment.find({
      patientId: patient._id,
      status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
    })
      .sort({ appointmentDate: 1 })
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name phone avatar' }, { path: 'departmentId' }] })
      .lean();

    const activeAdmission = await Admission.findOne({ patientId: patient._id, status: 'ACTIVE' })
      .populate({ path: 'bedId', populate: { path: 'wardId' } })
      .populate({ path: 'admittingDoctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }] })
      .lean();

    const prescriptions = await Prescription.find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }] })
      .lean();

    const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
      .sort({ recordDate: -1 })
      .limit(5)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .lean();

    const totalCompletedAppointments = await Appointment.countDocuments({
      patientId: patient._id,
      status: 'COMPLETED',
    });

    return res.json({
      success: true,
      data: {
        upcomingAppointments: upcomingAppointments.map((a: any) => ({
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
        prescriptions: prescriptions.map((p: any) => ({
          ...p,
          id: p._id.toString(),
          doctor: p.doctorId,
        })),
        medicalRecords: medicalRecords.map((m: any) => ({
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
