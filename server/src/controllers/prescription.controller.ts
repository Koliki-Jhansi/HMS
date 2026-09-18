import { Response } from 'express';
import mongoose from 'mongoose';
import { Prescription, Patient, Doctor, Appointment, MedicalRecord, Notification } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getPrescriptions = catchAsync(async (req: AuthRequest, res: Response) => {
  const { patientId, doctorId, appointmentId, search } = req.query;

  const query: any = {};

  if (req.user?.role === 'PATIENT' && req.user.patientId) {
    query.patientId = new mongoose.Types.ObjectId(req.user.patientId);
  } else if (req.user?.role === 'DOCTOR') {
    if (patientId && mongoose.Types.ObjectId.isValid(String(patientId))) {
      query.patientId = new mongoose.Types.ObjectId(String(patientId));
    } else if (req.user.doctorId) {
      query.doctorId = new mongoose.Types.ObjectId(req.user.doctorId);
    }
  } else {
    // Admin
    if (patientId && mongoose.Types.ObjectId.isValid(String(patientId))) {
      query.patientId = new mongoose.Types.ObjectId(String(patientId));
    }
    if (doctorId && mongoose.Types.ObjectId.isValid(String(doctorId))) {
      query.doctorId = new mongoose.Types.ObjectId(String(doctorId));
    }
  }

  if (appointmentId && mongoose.Types.ObjectId.isValid(String(appointmentId))) {
    query.appointmentId = new mongoose.Types.ObjectId(String(appointmentId));
  }

  let prescriptions = await Prescription.find(query)
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
    prescriptions = prescriptions.filter((pr: any) => {
      const num = pr.prescriptionNumber?.toLowerCase() || '';
      const diag = pr.diagnosis?.toLowerCase() || '';
      const pName = pr.patientId?.userId?.name?.toLowerCase() || '';
      const dName = pr.doctorId?.userId?.name?.toLowerCase() || '';
      return num.includes(q) || diag.includes(q) || pName.includes(q) || dName.includes(q);
    });
  }

  const formatted = prescriptions.map((pr: any) => ({
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
    items: (pr.items || []).map((item: any) => ({
      ...item,
      id: item._id ? item._id.toString() : item.id,
    })),
  }));

  res.json({ success: true, count: formatted.length, data: formatted });
});

export const getPrescriptionById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Prescription ID', 400);

  const prescription = await Prescription.findById(id)
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

  if (!prescription) throw new AppError('Prescription not found', 404);

  const patientIdStr = (prescription.patientId as any)?._id?.toString() || prescription.patientId?.toString();
  if (req.user?.role === 'PATIENT' && req.user.patientId !== patientIdStr) {
    throw new AppError('Forbidden: Access denied to this prescription', 403);
  }

  const formatted = {
    ...prescription,
    id: prescription._id.toString(),
    patient: prescription.patientId
      ? {
          ...(prescription.patientId as any),
          id: (prescription.patientId as any)._id?.toString(),
          user: (prescription.patientId as any).userId,
        }
      : null,
    doctor: prescription.doctorId
      ? {
          ...(prescription.doctorId as any),
          id: (prescription.doctorId as any)._id?.toString(),
          user: (prescription.doctorId as any).userId,
          department: (prescription.doctorId as any).departmentId,
        }
      : null,
    appointment: prescription.appointmentId,
    items: (prescription.items || []).map((item: any) => ({
      ...item,
      id: item._id ? item._id.toString() : item.id,
    })),
  };

  res.json({ success: true, data: formatted });
});

export const createPrescription = catchAsync(async (req: AuthRequest, res: Response) => {
  const { appointmentId, patientId, diagnosis, notes, followUpDate, items } = req.body;

  let doctorId = req.body.doctorId;
  if (req.user?.role === 'DOCTOR') {
    doctorId = req.user.doctorId;
  }

  if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Valid Doctor ID required', 400);
  }
  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId) || !diagnosis) {
    throw new AppError('Valid Patient ID and Clinical Diagnosis are required', 400);
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one prescription medicine item is required', 400);
  }

  const patient = await Patient.findById(patientId).populate('userId');
  if (!patient) throw new AppError('Patient not found', 404);

  const doctor = await Doctor.findById(doctorId).populate('userId');
  if (!doctor) throw new AppError('Doctor not found', 404);

  const prescCount = await Prescription.countDocuments();
  const prescriptionNumber = `RX-2026-${(8800 + prescCount + 1).toString()}`;

  // 1. Create prescription
  const prescription = await Prescription.create({
    prescriptionNumber,
    appointmentId: appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)
      ? new mongoose.Types.ObjectId(appointmentId)
      : undefined,
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    diagnosis,
    notes,
    followUpDate,
    items: items.map((item: any) => ({
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      route: item.route || 'Oral',
      instructions: item.instructions || 'Take as directed',
    })),
  });

  // 2. Also record in MedicalRecord for EHR completeness
  await MedicalRecord.create({
    recordNumber: `REC-RX-${Date.now().toString().slice(-4)}`,
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    title: `Prescription: ${diagnosis}`,
    recordType: 'CONSULTATION',
    notes: `Prescribed ${items.length} medication(s). Follow-up scheduled: ${followUpDate || 'None specified'}. Clinical Notes: ${notes || 'N/A'}`,
    recordDate: new Date().toISOString().split('T')[0],
  });

  // 3. Update appointment to COMPLETED if linked
  if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
    await Appointment.findByIdAndUpdate(appointmentId, { $set: { status: 'COMPLETED' } });
  }

  // 4. Notify patient
  const patientUser = (patient.userId as any);
  if (patientUser) {
    const doctorName = (doctor.userId as any)?.name || 'Doctor';
    await Notification.create({
      userId: patientUser._id || patientUser,
      title: 'New Prescription Issued',
      message: `Dr. ${doctorName} issued prescription ${prescriptionNumber} with ${items.length} medication(s).`,
      type: 'PRESCRIPTION',
      link: '/patient/prescriptions',
    });
  }

  const populated = await Prescription.findById(prescription._id)
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
      patient: (populated as any)?.patientId,
      doctor: (populated as any)?.doctorId,
      items: ((populated as any)?.items || []).map((item: any) => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
      })),
    },
  });
});
