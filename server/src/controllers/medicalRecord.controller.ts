import { Response } from 'express';
import mongoose from 'mongoose';
import { MedicalRecord, Patient, Doctor, Notification } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getMedicalRecords = catchAsync(async (req: AuthRequest, res: Response) => {
  const { patientId, doctorId, recordType, search } = req.query;

  const query: any = {};

  if (req.user?.role === 'PATIENT' && req.user.patientId) {
    query.patientId = new mongoose.Types.ObjectId(req.user.patientId);
  } else if (patientId && mongoose.Types.ObjectId.isValid(String(patientId))) {
    query.patientId = new mongoose.Types.ObjectId(String(patientId));
  }

  if (doctorId && mongoose.Types.ObjectId.isValid(String(doctorId))) {
    query.doctorId = new mongoose.Types.ObjectId(String(doctorId));
  }

  if (recordType && recordType !== 'ALL') {
    query.recordType = String(recordType);
  }

  let records = await MedicalRecord.find(query)
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
    records = records.filter((r: any) => {
      const num = r.recordNumber?.toLowerCase() || '';
      const title = r.title?.toLowerCase() || '';
      const notes = r.notes?.toLowerCase() || '';
      const pName = r.patientId?.userId?.name?.toLowerCase() || '';
      return num.includes(q) || title.includes(q) || notes.includes(q) || pName.includes(q);
    });
  }

  const formatted = records.map((r: any) => ({
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

export const createMedicalRecord = catchAsync(async (req: AuthRequest, res: Response) => {
  const { patientId, title, recordType, notes, attachments, recordDate } = req.body;

  let doctorId = req.body.doctorId;
  if (req.user?.role === 'DOCTOR') {
    doctorId = req.user.doctorId;
  }

  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId) || !title || !notes) {
    throw new AppError('Valid Patient ID, Title, and Clinical Notes are required', 400);
  }

  const patient = await Patient.findById(patientId).populate('userId');
  if (!patient) throw new AppError('Patient not found', 404);

  const recCount = await MedicalRecord.countDocuments();
  const recordNumber = `REC-2026-${(100 + recCount + 1).toString()}`;

  const record = await MedicalRecord.create({
    recordNumber,
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: doctorId && mongoose.Types.ObjectId.isValid(doctorId)
      ? new mongoose.Types.ObjectId(doctorId)
      : undefined,
    title,
    recordType: recordType || 'CONSULTATION',
    notes,
    attachments: attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null,
    recordDate: recordDate || new Date().toISOString().split('T')[0],
  });

  // Notify patient
  const patientUser = (patient.userId as any);
  if (patientUser) {
    await Notification.create({
      userId: patientUser._id || patientUser,
      title: 'New Medical Record Added',
      message: `A new ${recordType || 'clinical'} report "${title}" was appended to your health history.`,
      type: 'SYSTEM',
      link: '/patient/medical-records',
    });
  }

  const populated = await MedicalRecord.findById(record._id)
    .populate({ path: 'patientId', populate: { path: 'userId' } })
    .populate({ path: 'doctorId', populate: { path: 'userId' } })
    .lean();

  res.status(201).json({
    success: true,
    message: 'Medical record documented successfully',
    data: {
      ...populated,
      id: populated?._id.toString(),
      patient: (populated as any)?.patientId,
      doctor: (populated as any)?.doctorId,
    },
  });
});
