import { Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Patient, Doctor, Department } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { role, status, search } = req.query;

  const query: any = {};

  if (role && role !== 'ALL') {
    query.role = String(role);
  }

  if (status && status !== 'ALL') {
    query.status = String(status);
  }

  let users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();

  if (search) {
    const q = String(search).toLowerCase();
    users = users.filter((u: any) => {
      const name = u.name?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const phone = u.phone?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }

  const formattedUsers = await Promise.all(
    users.map(async (u: any) => {
      let patient = null;
      let doctor = null;

      if (u.role === 'PATIENT') {
        patient = await Patient.findOne({ userId: u._id }).lean();
        if (patient) {
          patient = { ...patient, id: (patient as any)._id.toString() };
        }
      } else if (u.role === 'DOCTOR') {
        doctor = await Doctor.findOne({ userId: u._id }).populate('departmentId').lean();
        if (doctor) {
          doctor = {
            ...doctor,
            id: (doctor as any)._id.toString(),
            department: (doctor as any).departmentId,
          };
        }
      }

      return {
        ...u,
        id: u._id.toString(),
        patient,
        doctor,
      };
    })
  );

  res.json({ success: true, count: formattedUsers.length, data: formattedUsers });
});

export const updateUserStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid User ID', 400);

  if (req.user?.id === id && status === 'INACTIVE') {
    throw new AppError('Cannot deactivate your own administrator account', 400);
  }

  const updateFields: any = {};
  if (status) updateFields.status = status;
  if (role) updateFields.role = role;

  const updated = await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
    .select('-password')
    .lean();

  if (!updated) throw new AppError('User not found', 404);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      ...updated,
      id: updated._id.toString(),
    },
  });
});

export const createStaffUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    specialization,
    licenseNumber,
    qualification,
    experienceYears,
    consultationFee,
    departmentId,
    roomNumber,
  } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError('Name, email, password, and role are required', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new AppError('User with this email already exists', 400);

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: phone?.trim(),
    role,
    status: 'ACTIVE',
  });

  let doctor = null;
  if (role === 'DOCTOR') {
    const docCount = await Doctor.countDocuments();
    const newDoc = await Doctor.create({
      userId: newUser._id,
      specialization: specialization || 'General Specialist',
      licenseNumber: licenseNumber || `MD-LIC-${1000 + docCount + 1}`,
      qualification: qualification || 'MBBS, MD',
      experienceYears: experienceYears ? Number(experienceYears) : 3,
      consultationFee: consultationFee ? Number(consultationFee) : 80,
      departmentId: departmentId && mongoose.Types.ObjectId.isValid(departmentId)
        ? new mongoose.Types.ObjectId(departmentId)
        : undefined,
      roomNumber,
    });
    doctor = await Doctor.findById(newDoc._id).populate('departmentId').lean();
  }

  res.status(201).json({
    success: true,
    message: 'Staff member created successfully',
    data: {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      doctor: doctor ? { ...doctor, id: (doctor as any)._id.toString() } : null,
    },
  });
});

export const deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid User ID', 400);

  if (req.user?.id === id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  await Promise.all([
    User.findByIdAndDelete(id),
    Patient.deleteMany({ userId: id }),
    Doctor.deleteMany({ userId: id }),
  ]);

  res.json({ success: true, message: 'User deleted successfully' });
});
