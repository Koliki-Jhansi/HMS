import { Response } from 'express';
import mongoose from 'mongoose';
import { Appointment, Doctor, Patient, Department, Prescription, Notification, Counter } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

const syncCounterWithExistingAppointments = async (counterName: string, currentYear: number): Promise<void> => {
  const existingCounter = await Counter.findOne({ name: counterName });
  if (!existingCounter) {
    const appointments = await Appointment.find({
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

    await Counter.findOneAndUpdate(
      { name: counterName },
      { $setOnInsert: { seq: maxSeq } },
      { upsert: true }
    );
  }
};

const generateUniqueAppointmentNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const counterName = `appointmentNumber_${currentYear}`;

  await syncCounterWithExistingAppointments(counterName, currentYear);

  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  let seqNum = counter.seq;
  let appointmentNumber = `APT-${currentYear}-${String(seqNum).padStart(6, '0')}`;

  // Safeguard: verify no collision with existing records
  while (await Appointment.exists({ appointmentNumber })) {
    const updated = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    seqNum = updated.seq;
    appointmentNumber = `APT-${currentYear}-${String(seqNum).padStart(6, '0')}`;
  }

  return appointmentNumber;
};



export const getAppointments = catchAsync(async (req: AuthRequest, res: Response) => {
  const { status, doctorId, patientId, departmentId, date, search } = req.query;

  const query: any = {};

  if (status && status !== 'ALL') {
    query.status = String(status);
  }

  if (date) {
    query.appointmentDate = String(date);
  }

  if (departmentId && departmentId !== 'ALL' && mongoose.Types.ObjectId.isValid(String(departmentId))) {
    query.departmentId = new mongoose.Types.ObjectId(String(departmentId));
  }

  // Role-based constraints
  if (req.user?.role === 'PATIENT' && req.user.patientId) {
    query.patientId = new mongoose.Types.ObjectId(req.user.patientId);
  } else if (req.user?.role === 'DOCTOR') {
    if (!doctorId && req.user.doctorId) {
      query.doctorId = new mongoose.Types.ObjectId(req.user.doctorId);
    } else if (doctorId && mongoose.Types.ObjectId.isValid(String(doctorId))) {
      query.doctorId = new mongoose.Types.ObjectId(String(doctorId));
    }
  } else {
    // ADMIN can filter by specific doctor or patient
    if (doctorId && doctorId !== 'ALL' && mongoose.Types.ObjectId.isValid(String(doctorId))) {
      query.doctorId = new mongoose.Types.ObjectId(String(doctorId));
    }
    if (patientId && patientId !== 'ALL' && mongoose.Types.ObjectId.isValid(String(patientId))) {
      query.patientId = new mongoose.Types.ObjectId(String(patientId));
    }
  }

  let appointments = await Appointment.find(query)
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
    appointments = appointments.filter((apt: any) => {
      const num = apt.appointmentNumber?.toLowerCase() || '';
      const reason = apt.reason?.toLowerCase() || '';
      const pName = apt.patientId?.userId?.name?.toLowerCase() || '';
      const dName = apt.doctorId?.userId?.name?.toLowerCase() || '';
      return num.includes(q) || reason.includes(q) || pName.includes(q) || dName.includes(q);
    });
  }

  const formatted = await Promise.all(
    appointments.map(async (apt: any) => {
      const prescription = await Prescription.findOne({ appointmentId: apt._id }).lean();
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
    })
  );

  res.json({ success: true, count: formatted.length, data: formatted });
});

export const getAppointmentById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Appointment ID', 400);

  const appointment = await Appointment.findById(id)
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

  if (!appointment) throw new AppError('Appointment not found', 404);

  // RBAC checks
  if (req.user?.role === 'PATIENT' && (appointment.patientId as any)?._id.toString() !== req.user.patientId) {
    throw new AppError('Forbidden: Not authorized to view this appointment', 403);
  }

  const prescription = await Prescription.findOne({ appointmentId: appointment._id }).lean();

  const formatted = {
    ...appointment,
    id: appointment._id.toString(),
    patient: appointment.patientId
      ? {
          ...(appointment.patientId as any),
          id: (appointment.patientId as any)._id.toString(),
          user: (appointment.patientId as any).userId,
        }
      : null,
    doctor: appointment.doctorId
      ? {
          ...(appointment.doctorId as any),
          id: (appointment.doctorId as any)._id.toString(),
          user: (appointment.doctorId as any).userId,
          department: (appointment.doctorId as any).departmentId,
        }
      : null,
    department: appointment.departmentId,
    prescription: prescription ? { ...prescription, id: prescription._id.toString() } : null,
  };

  res.json({ success: true, data: formatted });
});

export const createAppointment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { doctorId, departmentId, appointmentDate, timeSlot, reason, symptoms } = req.body;

  let patientId = req.body.patientId;
  if (req.user?.role === 'PATIENT') {
    patientId = req.user.patientId;
  }

  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Valid Patient ID required', 400);
  }
  if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId) || !appointmentDate || !timeSlot || !reason) {
    throw new AppError('Valid Doctor, Date, Time slot, and Reason are required', 400);
  }

  const doctor = await Doctor.findById(doctorId).populate('userId');
  if (!doctor) throw new AppError('Doctor not found', 404);

  const patient = await Patient.findById(patientId).populate('userId');
  if (!patient) throw new AppError('Patient not found', 404);

  // Check for duplicate booking for same doctor, date and slot
  const existingSlot = await Appointment.findOne({
    doctorId: new mongoose.Types.ObjectId(doctorId),
    appointmentDate,
    timeSlot,
    status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
  });

  if (existingSlot) {
    throw new AppError('This time slot is already booked for this doctor. Please choose another time slot.', 400);
  }

  let apt: any = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const appointmentNumber = await generateUniqueAppointmentNumber();
      apt = await Appointment.create({
        appointmentNumber,
        patientId: new mongoose.Types.ObjectId(patientId),
        doctorId: new mongoose.Types.ObjectId(doctorId),
        departmentId: departmentId && mongoose.Types.ObjectId.isValid(departmentId)
          ? new mongoose.Types.ObjectId(departmentId)
          : doctor.departmentId,
        appointmentDate,
        timeSlot,
        status: 'PENDING',
        reason,
        symptoms,
      });
      break;
    } catch (err: any) {
      if (err.code === 11000 && (err.keyPattern?.appointmentNumber || String(err.message).includes('appointmentNumber'))) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new AppError('Unable to generate unique appointment number. Please try again.', 500);
        }
      } else {
        throw err;
      }
    }
  }

  if (!apt) {
    throw new AppError('Failed to create appointment record', 500);
  }


  // Notify doctor
  const docUser = (doctor.userId as any);
  if (docUser) {
    const patientName = (patient.userId as any)?.name || 'A patient';
    await Notification.create({
      userId: docUser._id || docUser,
      title: 'New Appointment Booking',
      message: `${patientName} booked an appointment for ${appointmentDate} at ${timeSlot}.`,
      type: 'APPOINTMENT',
      link: '/doctor/appointments',
    });
  }

  const populated = await Appointment.findById(apt._id)
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
      patient: (populated as any)?.patientId,
      doctor: (populated as any)?.doctorId,
    },
  });
});

export const updateAppointmentStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes, rejectionReason, cancellationReason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Appointment ID', 400);

  const validStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const appointment = await Appointment.findById(id)
    .populate({ path: 'patientId', populate: { path: 'userId' } })
    .populate({ path: 'doctorId', populate: { path: 'userId' } });

  if (!appointment) throw new AppError('Appointment not found', 404);

  // Role authorization
  if (req.user?.role === 'PATIENT') {
    const patientDocId = (appointment.patientId as any)._id.toString();
    if (patientDocId !== req.user.patientId) throw new AppError('Unauthorized', 403);
    if (status !== 'CANCELLED') {
      throw new AppError('Patients can only cancel appointments', 403);
    }
  }

  if (req.user?.role === 'DOCTOR') {
    const doctorDocId = (appointment.doctorId as any)._id.toString();
    if (doctorDocId !== req.user.doctorId) throw new AppError('Unauthorized for this appointment', 403);
  }

  appointment.status = status;
  if (notes !== undefined) appointment.notes = notes;
  if (rejectionReason !== undefined) appointment.rejectionReason = rejectionReason;
  if (cancellationReason !== undefined) appointment.cancellationReason = cancellationReason;

  await appointment.save();

  // Notify patient about status change
  const patientUser = (appointment.patientId as any)?.userId;
  const doctorUser = (appointment.doctorId as any)?.userId;
  const doctorName = doctorUser?.name || 'Doctor';

  if (patientUser) {
    let statusMessage = `Your appointment on ${appointment.appointmentDate} at ${appointment.timeSlot} with Dr. ${doctorName} is now ${status}.`;
    if (status === 'REJECTED' && rejectionReason) {
      statusMessage += ` Reason: ${rejectionReason}`;
    }

    await Notification.create({
      userId: patientUser._id || patientUser,
      title: `Appointment Status: ${status}`,
      message: statusMessage,
      type: 'APPOINTMENT',
      link: '/patient/appointments',
    });
  }

  const updatedPopulated = await Appointment.findById(appointment._id)
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
      patient: (updatedPopulated as any)?.patientId,
      doctor: (updatedPopulated as any)?.doctorId,
    },
  });
});

export const rescheduleAppointment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { appointmentDate, timeSlot } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Appointment ID', 400);
  if (!appointmentDate || !timeSlot) {
    throw new AppError('New appointment date and time slot are required', 400);
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) throw new AppError('Appointment not found', 404);

  // Check collision
  const collision = await Appointment.findOne({
    _id: { $ne: new mongoose.Types.ObjectId(id) },
    doctorId: appointment.doctorId,
    appointmentDate,
    timeSlot,
    status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
  });

  if (collision) {
    throw new AppError('Selected time slot is already booked for this doctor', 400);
  }

  appointment.appointmentDate = appointmentDate;
  appointment.timeSlot = timeSlot;
  appointment.status = 'PENDING'; // Reset to pending for doctor confirmation
  await appointment.save();

  const updatedPopulated = await Appointment.findById(appointment._id)
    .populate({ path: 'patientId', populate: { path: 'userId' } })
    .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
    .lean();

  res.json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: {
      ...updatedPopulated,
      id: updatedPopulated?._id.toString(),
      patient: (updatedPopulated as any)?.patientId,
      doctor: (updatedPopulated as any)?.doctorId,
    },
  });
});
