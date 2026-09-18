import { Response } from 'express';
import mongoose from 'mongoose';
import { Admission, Bed, Patient, Doctor, MedicalRecord, Notification, User, Ward } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getAdmissions = catchAsync(async (req: AuthRequest, res: Response) => {
  const { status, patientId, doctorId, search } = req.query;

  const query: any = {};

  if (status && status !== 'ALL') {
    query.status = String(status);
  }

  if (patientId && mongoose.Types.ObjectId.isValid(String(patientId))) {
    query.patientId = new mongoose.Types.ObjectId(String(patientId));
  } else if (req.user?.role === 'PATIENT' && req.user.patientId) {
    query.patientId = new mongoose.Types.ObjectId(req.user.patientId);
  }

  if (doctorId && mongoose.Types.ObjectId.isValid(String(doctorId))) {
    query.admittingDoctorId = new mongoose.Types.ObjectId(String(doctorId));
  } else if (req.user?.role === 'DOCTOR' && req.user.doctorId) {
    query.admittingDoctorId = new mongoose.Types.ObjectId(req.user.doctorId);
  }

  let admissions = await Admission.find(query)
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
    admissions = admissions.filter((adm: any) => {
      const num = adm.admissionNumber?.toLowerCase() || '';
      const reason = adm.reason?.toLowerCase() || '';
      const diag = adm.diagnosis?.toLowerCase() || '';
      const pName = adm.patientId?.userId?.name?.toLowerCase() || '';
      const mrn = adm.patientId?.medicalRecordNumber?.toLowerCase() || '';
      return num.includes(q) || reason.includes(q) || diag.includes(q) || pName.includes(q) || mrn.includes(q);
    });
  }

  const formatted = admissions.map((adm: any) => ({
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

export const getAdmissionById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Admission ID', 400);

  const admission = await Admission.findById(id)
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

  if (!admission) throw new AppError('Admission record not found', 404);

  const formatted = {
    ...admission,
    id: admission._id.toString(),
    patient: admission.patientId
      ? {
          ...admission.patientId,
          id: (admission.patientId as any)._id.toString(),
          user: (admission.patientId as any).userId,
        }
      : null,
    bed: admission.bedId
      ? {
          ...admission.bedId,
          id: (admission.bedId as any)._id.toString(),
          ward: (admission.bedId as any).wardId,
        }
      : null,
    doctor: admission.admittingDoctorId
      ? {
          ...admission.admittingDoctorId,
          id: (admission.admittingDoctorId as any)._id.toString(),
          user: (admission.admittingDoctorId as any).userId,
        }
      : null,
  };

  res.json({ success: true, data: formatted });
});

export const createAdmission = catchAsync(async (req: AuthRequest, res: Response) => {
  const { patientId, bedId, admittingDoctorId, reason, diagnosis, notes } = req.body;

  if (!patientId || !bedId || !admittingDoctorId || !reason) {
    throw new AppError('Patient, Bed, Doctor, and Reason for admission are required', 400);
  }

  // Check if patient is already actively admitted
  const existingActive = await Admission.findOne({
    patientId: new mongoose.Types.ObjectId(patientId),
    status: 'ACTIVE',
  });
  if (existingActive) {
    throw new AppError('Patient is already actively admitted in a ward', 400);
  }

  // Check bed availability
  const bed = await Bed.findById(bedId).populate('wardId');
  if (!bed) throw new AppError('Selected bed not found', 404);
  if (bed.status !== 'AVAILABLE') {
    throw new AppError(`Bed ${bed.bedNumber} is currently ${bed.status}. Please choose an Available bed.`, 400);
  }

  const patient = await Patient.findById(patientId).populate('userId');
  if (!patient) throw new AppError('Patient not found', 404);

  const doctor = await Doctor.findById(admittingDoctorId).populate('userId');
  if (!doctor) throw new AppError('Doctor not found', 404);

  const admissionCount = await Admission.countDocuments();
  const admissionNumber = `ADM-2026-${(1001 + admissionCount).toString()}`;

  // 1. Create admission record
  const admission = await Admission.create({
    admissionNumber,
    patientId: new mongoose.Types.ObjectId(patientId),
    bedId: new mongoose.Types.ObjectId(bedId),
    admittingDoctorId: new mongoose.Types.ObjectId(admittingDoctorId),
    admissionDate: new Date(),
    reason,
    diagnosis,
    status: 'ACTIVE',
  });

  // 2. Automatically mark assigned bed as OCCUPIED
  await Bed.findByIdAndUpdate(bedId, { $set: { status: 'OCCUPIED' } });

  // 3. Send notification to patient
  if (patient.userId) {
    await Notification.create({
      userId: (patient.userId as any)._id || patient.userId,
      title: 'Hospital Admission Confirmed',
      message: `You have been admitted to ${(bed.wardId as any)?.name || 'Ward'}, Bed ${bed.bedNumber} under Dr. ${(doctor.userId as any)?.name || 'Physician'}.`,
      type: 'ADMISSION',
      link: '/patient/bed-admission',
    });
  }

  // 4. Send notification to admitting doctor
  if (doctor.userId) {
    await Notification.create({
      userId: (doctor.userId as any)._id || doctor.userId,
      title: 'New Inpatient Assigned',
      message: `Patient ${(patient.userId as any)?.name || 'Patient'} admitted to ${(bed.wardId as any)?.name || 'Ward'} Bed ${bed.bedNumber}.`,
      type: 'ADMISSION',
      link: '/doctor/patients',
    });
  }

  const populated = await Admission.findById(admission._id)
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
      patient: (populated as any)?.patientId,
      bed: (populated as any)?.bedId,
      doctor: (populated as any)?.admittingDoctorId,
    },
  });
});

export const dischargePatient = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { dischargeSummary, postDischargeBedStatus = 'CLEANING', totalBill } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Admission ID', 400);

  const admission = await Admission.findById(id)
    .populate({ path: 'bedId', populate: { path: 'wardId' } })
    .populate({ path: 'patientId', populate: { path: 'userId' } })
    .populate({ path: 'admittingDoctorId', populate: { path: 'userId' } });

  if (!admission) throw new AppError('Admission record not found', 404);
  if (admission.status === 'DISCHARGED') {
    throw new AppError('Patient is already discharged', 400);
  }

  const dischargeDate = new Date();
  const bedDoc = admission.bedId as any;
  const dailyRate = bedDoc?.dailyRate || 100;

  // Calculate bill if not provided
  const daysStayed = Math.max(
    1,
    Math.ceil(
      (dischargeDate.getTime() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  );
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
  await Bed.findByIdAndUpdate(bedDoc._id, { $set: { status: newBedStatus } });

  // 3. Create medical record for discharge summary
  await MedicalRecord.create({
    recordNumber: `REC-DIS-${Date.now().toString().slice(-4)}`,
    patientId: (admission.patientId as any)._id,
    doctorId: (admission.admittingDoctorId as any)._id,
    title: `Discharge Summary: ${admission.reason}`,
    recordType: 'DISCHARGE_SUMMARY',
    notes: dischargeSummary || `Discharged on ${dischargeDate.toLocaleDateString()}. Total stay: ${daysStayed} day(s). Final bill: $${calculatedBill}.`,
    recordDate: dischargeDate.toISOString().split('T')[0],
  });

  // 4. Notify patient
  const patientUser = (admission.patientId as any)?.userId;
  if (patientUser) {
    await Notification.create({
      userId: patientUser._id || patientUser,
      title: 'Hospital Discharge Completed',
      message: `You have been officially discharged. Total hospital stay: ${daysStayed} day(s).`,
      type: 'ADMISSION',
      link: '/patient/medical-records',
    });
  }

  const updatedPopulated = await Admission.findById(admission._id)
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
      patient: (updatedPopulated as any)?.patientId,
      bed: (updatedPopulated as any)?.bedId,
      doctor: (updatedPopulated as any)?.admittingDoctorId,
    },
  });
});

export const transferBed = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { newBedId, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Admission ID', 400);
  if (!mongoose.Types.ObjectId.isValid(newBedId)) throw new AppError('Invalid Destination Bed ID', 400);

  const admission = await Admission.findById(id)
    .populate('bedId')
    .populate({ path: 'patientId', populate: { path: 'userId' } });

  if (!admission) throw new AppError('Admission record not found', 404);
  if (admission.status !== 'ACTIVE') throw new AppError('Only active admissions can be transferred', 400);

  const newBed = await Bed.findById(newBedId).populate('wardId');
  if (!newBed) throw new AppError('Destination bed not found', 404);
  if (newBed.status !== 'AVAILABLE') {
    throw new AppError(`Destination bed ${newBed.bedNumber} is ${newBed.status}, not AVAILABLE`, 400);
  }

  const oldBedId = (admission.bedId as any)._id;

  // Free previous bed
  await Bed.findByIdAndUpdate(oldBedId, { $set: { status: 'CLEANING' } });

  // Occupy new bed
  await Bed.findByIdAndUpdate(newBedId, { $set: { status: 'OCCUPIED' } });

  // Update admission bed
  admission.bedId = newBed._id;
  await admission.save();

  // Notify patient
  const patientUser = (admission.patientId as any)?.userId;
  if (patientUser) {
    const wardName = (newBed.wardId as any)?.name || 'Ward';
    await Notification.create({
      userId: patientUser._id || patientUser,
      title: 'Bed Transfer Completed',
      message: `You have been transferred to ${wardName}, Bed ${newBed.bedNumber}.`,
      type: 'BED',
      link: '/patient/bed-admission',
    });
  }

  const updatedPopulated = await Admission.findById(admission._id)
    .populate({ path: 'patientId', populate: { path: 'userId' } })
    .populate({ path: 'bedId', populate: { path: 'wardId' } })
    .populate({ path: 'admittingDoctorId', populate: { path: 'userId' } })
    .lean();

  const wardName = (newBed.wardId as any)?.name || 'Ward';
  res.json({
    success: true,
    message: `Patient successfully transferred to ${wardName} Bed ${newBed.bedNumber}`,
    data: {
      ...updatedPopulated,
      id: updatedPopulated?._id.toString(),
      patient: (updatedPopulated as any)?.patientId,
      bed: (updatedPopulated as any)?.bedId,
      doctor: (updatedPopulated as any)?.admittingDoctorId,
    },
  });
});
