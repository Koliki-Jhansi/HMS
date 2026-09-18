import { Response } from 'express';
import mongoose from 'mongoose';
import { Doctor, User, Department, Appointment, Patient, DoctorSchedule, Prescription } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getDoctors = catchAsync(async (req: AuthRequest, res: Response) => {
  const { departmentId, search, day } = req.query;

  const query: any = {};

  if (departmentId && departmentId !== 'ALL') {
    if (mongoose.Types.ObjectId.isValid(String(departmentId))) {
      query.departmentId = new mongoose.Types.ObjectId(String(departmentId));
    }
  }

  if (day) {
    query.availableDays = { $regex: String(day), $options: 'i' };
  }

  let doctors = await Doctor.find(query)
    .populate('userId', 'name email phone avatar status')
    .populate('departmentId', 'name code description')
    .sort({ experienceYears: -1 })
    .lean();

  if (search) {
    const q = String(search).toLowerCase();
    doctors = doctors.filter((doc: any) => {
      const name = doc.userId?.name?.toLowerCase() || '';
      const spec = doc.specialization?.toLowerCase() || '';
      const qual = doc.qualification?.toLowerCase() || '';
      return name.includes(q) || spec.includes(q) || qual.includes(q);
    });
  }

  // Format id fields
  const formatted = doctors.map((doc: any) => ({
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

export const getDoctorById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid Doctor ID format', 400);
  }

  const doctor = await Doctor.findById(id)
    .populate('userId', 'name email phone avatar status')
    .populate('departmentId')
    .lean();

  if (!doctor) throw new AppError('Doctor not found', 404);

  const appointments = await Appointment.find({ doctorId: doctor._id })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name' },
    })
    .sort({ appointmentDate: -1 })
    .limit(10)
    .lean();

  const schedules = await DoctorSchedule.find({ doctorId: doctor._id }).lean();

  const formatted = {
    ...doctor,
    id: doctor._id.toString(),
    user: doctor.userId,
    department: doctor.departmentId,
    appointments: appointments.map((a: any) => ({
      ...a,
      id: a._id.toString(),
      patient: a.patientId,
    })),
    schedules: schedules.map((s: any) => ({ ...s, id: s._id.toString() })),
  };

  res.json({ success: true, data: formatted });
});

export const updateDoctorSchedule = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { availableDays, timeSlots, roomNumber, consultationFee, schedules } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid Doctor ID', 400);
  }

  // Only allow admin or the doctor himself
  if (req.user?.role !== 'ADMIN' && req.user?.doctorId !== id) {
    throw new AppError('Forbidden to update this doctor schedule', 403);
  }

  const updateFields: any = {};
  if (availableDays) updateFields.availableDays = availableDays;
  if (timeSlots) updateFields.timeSlots = timeSlots;
  if (roomNumber !== undefined) updateFields.roomNumber = roomNumber;
  if (consultationFee !== undefined) updateFields.consultationFee = Number(consultationFee);

  const updated = await Doctor.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
    .populate('userId', 'name email phone avatar')
    .populate('departmentId')
    .lean();

  if (!updated) throw new AppError('Doctor not found', 404);

  // If detailed weekly schedules were provided, sync them
  if (Array.isArray(schedules)) {
    await DoctorSchedule.deleteMany({ doctorId: updated._id });
    if (schedules.length > 0) {
      await DoctorSchedule.insertMany(
        schedules.map((s: any) => ({
          doctorId: updated._id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '17:00',
          slotDurationMinutes: s.slotDurationMinutes || 30,
          maxPatientsPerSlot: s.maxPatientsPerSlot || 1,
          isAvailable: s.isAvailable !== false,
        }))
      );
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

export const getDoctorPatients = catchAsync(async (req: AuthRequest, res: Response) => {
  let doctorId = req.user?.doctorId;
  if (!doctorId && req.user?.role !== 'ADMIN') {
    throw new AppError('Doctor profile required', 400);
  }

  if (req.user?.role === 'ADMIN' && req.query.doctorId) {
    doctorId = String(req.query.doctorId);
  }

  const appointmentQuery: any = {};
  if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
    appointmentQuery.doctorId = new mongoose.Types.ObjectId(doctorId);
  }

  const patientIds = await Appointment.find(appointmentQuery).distinct('patientId');

  const patients = await Patient.find({ _id: { $in: patientIds } })
    .populate('userId', 'name email phone avatar')
    .lean();

  const formattedPatients = await Promise.all(
    patients.map(async (p: any) => {
      const recentAppointments = await Appointment.find({
        patientId: p._id,
        ...(doctorId && mongoose.Types.ObjectId.isValid(doctorId)
          ? { doctorId: new mongoose.Types.ObjectId(doctorId) }
          : {}),
      })
        .sort({ appointmentDate: -1 })
        .limit(3)
        .lean();

      const recentPrescriptions = await Prescription.find({
        patientId: p._id,
        ...(doctorId && mongoose.Types.ObjectId.isValid(doctorId)
          ? { doctorId: new mongoose.Types.ObjectId(doctorId) }
          : {}),
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      return {
        ...p,
        id: p._id.toString(),
        user: p.userId,
        appointments: recentAppointments.map((a: any) => ({ ...a, id: a._id.toString() })),
        prescriptions: recentPrescriptions.map((pr: any) => ({ ...pr, id: pr._id.toString() })),
      };
    })
  );

  res.json({ success: true, count: formattedPatients.length, data: formattedPatients });
});

export const getDoctorSchedules = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid Doctor ID', 400);
  }

  const schedules = await DoctorSchedule.find({ doctorId: id }).lean();
  res.json({
    success: true,
    data: schedules.map((s: any) => ({ ...s, id: s._id.toString() })),
  });
});
