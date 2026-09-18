import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, Patient, Doctor, Department, Notification } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).default('PATIENT'),
  // Optional patient profile fields
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  // Optional doctor profile fields
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  qualification: z.string().optional(),
  experienceYears: z.number().optional(),
  consultationFee: z.number().optional(),
  departmentId: z.string().optional(),
});

const generateToken = (userId: string, email: string, role: string) => {
  const secret = process.env.JWT_SECRET || 'super_secret_hospital_jwt_token_key_2026';
  return jwt.sign({ id: userId, email, role }, secret, { expiresIn: '7d' });
};

export const register = catchAsync(async (req: AuthRequest, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400);
  }

  const {
    name,
    email,
    password,
    phone,
    role,
    gender,
    dateOfBirth,
    bloodGroup,
    address,
    emergencyContactName,
    emergencyContactPhone,
    allergies,
    chronicConditions,
    specialization,
    licenseNumber,
    qualification,
    experienceYears,
    consultationFee,
    departmentId,
  } = parsed.data;

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new AppError('Email address is already registered', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: phone?.trim(),
    role,
    status: 'ACTIVE',
  });

  let patientDoc = null;
  let doctorDoc = null;

  if (role === 'PATIENT') {
    const mrnCount = await Patient.countDocuments();
    const mrn = `MRN-2026-${(1001 + mrnCount).toString()}`;
    patientDoc = await Patient.create({
      userId: newUser._id,
      medicalRecordNumber: mrn,
      gender: gender as any,
      dateOfBirth,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      chronicConditions,
    });
  } else if (role === 'DOCTOR') {
    const docCount = await Doctor.countDocuments();
    doctorDoc = await Doctor.create({
      userId: newUser._id,
      specialization: specialization || 'General Medicine',
      licenseNumber: licenseNumber || `MD-LIC-${1000 + docCount}`,
      qualification: qualification || 'MBBS, MD',
      experienceYears: experienceYears || 3,
      consultationFee: consultationFee || 60,
      departmentId: departmentId || undefined,
    });
  }

  // Welcome notification
  await Notification.create({
    userId: newUser._id,
    title: 'Welcome to Hospital Care Portal',
    message: `Welcome ${name}! Your account has been successfully created with role ${role}.`,
    type: 'SYSTEM',
  });

  const token = generateToken(newUser._id.toString(), newUser.email, newUser.role);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      avatar: newUser.avatar,
      patient: patientDoc,
      doctor: doctorDoc,
    },
  });
});

export const login = catchAsync(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('Invalid email or password credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password credentials', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('Your account has been deactivated. Please contact administration.', 403);
  }

  let patient = null;
  let doctor = null;

  if (user.role === 'PATIENT') {
    patient = await Patient.findOne({ userId: user._id });
  } else if (user.role === 'DOCTOR') {
    doctor = await Doctor.findOne({ userId: user._id }).populate('departmentId');
  }

  const token = generateToken(user._id.toString(), user.email, user.role);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      patient,
      doctor,
    },
  });
});

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let patient = null;
  let doctor = null;

  if (user.role === 'PATIENT') {
    patient = await Patient.findOne({ userId: user._id });
  } else if (user.role === 'DOCTOR') {
    doctor = await Doctor.findOne({ userId: user._id }).populate('departmentId');
  }

  res.json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      patient,
      doctor,
    },
  });
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const { name, phone, avatar, patientData, doctorData } = req.body;

  const updateFields: any = {};
  if (name) updateFields.name = name;
  if (phone !== undefined) updateFields.phone = phone;
  if (avatar !== undefined) updateFields.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true });
  if (!user) throw new AppError('User not found', 404);

  let patient = null;
  let doctor = null;

  if (user.role === 'PATIENT' && patientData) {
    patient = await Patient.findOneAndUpdate(
      { userId: user._id },
      { $set: patientData },
      { new: true, upsert: true }
    );
  } else if (user.role === 'PATIENT') {
    patient = await Patient.findOne({ userId: user._id });
  }

  if (user.role === 'DOCTOR' && doctorData) {
    doctor = await Doctor.findOneAndUpdate(
      { userId: user._id },
      { $set: doctorData },
      { new: true }
    ).populate('departmentId');
  } else if (user.role === 'DOCTOR') {
    doctor = await Doctor.findOne({ userId: user._id }).populate('departmentId');
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      patient,
      doctor,
    },
  });
});
