import { Response } from 'express';
import mongoose from 'mongoose';
import { Patient, User, Appointment, Admission, Prescription, MedicalRecord, Bed } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getPatients = catchAsync(async (req: AuthRequest, res: Response) => {
  const { search, bloodGroup } = req.query;

  const query: any = {};
  if (bloodGroup && bloodGroup !== 'ALL') {
    query.bloodGroup = String(bloodGroup);
  }

  let patients = await Patient.find(query)
    .populate('userId', 'name email phone avatar status')
    .sort({ createdAt: -1 })
    .lean();

  if (search) {
    const q = String(search).toLowerCase();
    patients = patients.filter((p: any) => {
      const name = p.userId?.name?.toLowerCase() || '';
      const email = p.userId?.email?.toLowerCase() || '';
      const phone = p.userId?.phone?.toLowerCase() || '';
      const mrn = p.medicalRecordNumber?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || phone.includes(q) || mrn.includes(q);
    });
  }

  const formattedPatients = await Promise.all(
    patients.map(async (p: any) => {
      const activeAdmission = await Admission.findOne({
        patientId: p._id,
        status: 'ACTIVE',
      })
        .populate({
          path: 'bedId',
          populate: { path: 'wardId' },
        })
        .lean();

      const [appointmentsCount, admissionsCount, prescriptionsCount, recordsCount] = await Promise.all([
        Appointment.countDocuments({ patientId: p._id }),
        Admission.countDocuments({ patientId: p._id }),
        Prescription.countDocuments({ patientId: p._id }),
        MedicalRecord.countDocuments({ patientId: p._id }),
      ]);

      return {
        ...p,
        id: p._id.toString(),
        user: p.userId
          ? {
              ...p.userId,
              id: p.userId._id ? p.userId._id.toString() : p.userId.toString(),
            }
          : null,
        admissions: activeAdmission
          ? [
              {
                ...activeAdmission,
                id: activeAdmission._id.toString(),
                bed: activeAdmission.bedId
                  ? {
                      ...(activeAdmission.bedId as any),
                      id: (activeAdmission.bedId as any)._id.toString(),
                      ward: (activeAdmission.bedId as any).wardId,
                    }
                  : null,
              },
            ]
          : [],
        _count: {
          appointments: appointmentsCount,
          admissions: admissionsCount,
          prescriptions: prescriptionsCount,
          medicalRecords: recordsCount,
        },
      };
    })
  );

  res.json({ success: true, count: formattedPatients.length, data: formattedPatients });
});

export const getPatientById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid Patient ID format', 400);
  }

  // Authorization: Admins and Doctors can view any; Patient can view only own
  if (req.user?.role === 'PATIENT' && req.user.patientId !== id) {
    throw new AppError('Forbidden: You can only view your own records', 403);
  }

  const patient = await Patient.findById(id)
    .populate('userId', 'name email phone avatar status')
    .lean();

  if (!patient) throw new AppError('Patient not found', 404);

  const [appointments, admissions, prescriptions, medicalRecords] = await Promise.all([
    Appointment.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }],
      })
      .sort({ appointmentDate: -1 })
      .lean(),
    Admission.find({ patientId: patient._id })
      .populate({
        path: 'bedId',
        populate: { path: 'wardId' },
      })
      .populate({
        path: 'admittingDoctorId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ admissionDate: -1 })
      .lean(),
    Prescription.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .lean(),
    MedicalRecord.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ recordDate: -1 })
      .lean(),
  ]);

  const formatted = {
    ...patient,
    id: patient._id.toString(),
    user: patient.userId,
    appointments: appointments.map((a: any) => ({
      ...a,
      id: a._id.toString(),
      doctor: a.doctorId
        ? {
            ...a.doctorId,
            id: a.doctorId._id.toString(),
            user: a.doctorId.userId,
            department: a.doctorId.departmentId,
          }
        : null,
    })),
    admissions: admissions.map((adm: any) => ({
      ...adm,
      id: adm._id.toString(),
      bed: adm.bedId
        ? {
            ...adm.bedId,
            id: adm.bedId._id.toString(),
            ward: adm.bedId.wardId,
          }
        : null,
      doctor: adm.admittingDoctorId
        ? {
            ...adm.admittingDoctorId,
            id: adm.admittingDoctorId._id.toString(),
            user: adm.admittingDoctorId.userId,
          }
        : null,
    })),
    prescriptions: prescriptions.map((pr: any) => ({
      ...pr,
      id: pr._id.toString(),
      doctor: pr.doctorId
        ? {
            ...pr.doctorId,
            id: pr.doctorId._id.toString(),
            user: pr.doctorId.userId,
          }
        : null,
    })),
    medicalRecords: medicalRecords.map((mr: any) => ({
      ...mr,
      id: mr._id.toString(),
      doctor: mr.doctorId
        ? {
            ...mr.doctorId,
            id: mr.doctorId._id.toString(),
            user: mr.doctorId.userId,
          }
        : null,
    })),
  };

  res.json({ success: true, data: formatted });
});

export const updatePatientMedicalInfo = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    gender,
    dateOfBirth,
    bloodGroup,
    address,
    emergencyContactName,
    emergencyContactPhone,
    allergies,
    chronicConditions,
    insuranceProvider,
    insurancePolicyNumber,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid Patient ID format', 400);
  }

  if (req.user?.role === 'PATIENT' && req.user.patientId !== id) {
    throw new AppError('Unauthorized to modify this profile', 403);
  }

  const updateFields: any = {};
  if (gender) updateFields.gender = gender;
  if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
  if (bloodGroup) updateFields.bloodGroup = bloodGroup;
  if (address !== undefined) updateFields.address = address;
  if (emergencyContactName !== undefined) updateFields.emergencyContactName = emergencyContactName;
  if (emergencyContactPhone !== undefined) updateFields.emergencyContactPhone = emergencyContactPhone;
  if (allergies !== undefined) updateFields.allergies = allergies;
  if (chronicConditions !== undefined) updateFields.chronicConditions = chronicConditions;
  if (insuranceProvider !== undefined) updateFields.insuranceProvider = insuranceProvider;
  if (insurancePolicyNumber !== undefined) updateFields.insurancePolicyNumber = insurancePolicyNumber;

  const updated = await Patient.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
    .populate('userId', 'name email phone avatar')
    .lean();

  if (!updated) throw new AppError('Patient not found', 404);

  res.json({
    success: true,
    message: 'Patient profile updated',
    data: {
      ...updated,
      id: updated._id.toString(),
      user: updated.userId,
    },
  });
});
