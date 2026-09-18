import { Response } from 'express';
import mongoose from 'mongoose';
import { Department, Doctor, Appointment } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getDepartments = catchAsync(async (req: AuthRequest, res: Response) => {
  const departments = await Department.find().sort({ name: 1 }).lean();

  const formatted = await Promise.all(
    departments.map(async (dept: any) => {
      const doctors = await Doctor.find({ departmentId: dept._id })
        .populate('userId', 'name email phone avatar')
        .lean();

      const appointmentsCount = await Appointment.countDocuments({ departmentId: dept._id });

      return {
        ...dept,
        id: dept._id.toString(),
        doctors: doctors.map((d: any) => ({
          ...d,
          id: d._id.toString(),
          user: d.userId,
        })),
        _count: {
          doctors: doctors.length,
          appointments: appointmentsCount,
        },
      };
    })
  );

  res.json({ success: true, count: formatted.length, data: formatted });
});

export const getDepartmentById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Department ID', 400);

  const department = await Department.findById(id).lean();
  if (!department) throw new AppError('Department not found', 404);

  const doctors = await Doctor.find({ departmentId: department._id })
    .populate('userId', 'name email phone avatar')
    .lean();

  res.json({
    success: true,
    data: {
      ...department,
      id: department._id.toString(),
      doctors: doctors.map((d: any) => ({
        ...d,
        id: d._id.toString(),
        user: d.userId,
      })),
    },
  });
});

export const createDepartment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, code, description, icon } = req.body;

  if (!name || !code) throw new AppError('Department name and unique code are required', 400);

  const existing = await Department.findOne({
    $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
  });

  if (existing) throw new AppError('Department name or code already exists', 400);

  const department = await Department.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    description,
    icon: icon || 'Building2',
  });

  res.status(201).json({
    success: true,
    message: 'Department created',
    data: {
      ...department.toJSON(),
      id: department._id.toString(),
    },
  });
});

export const updateDepartment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Department ID', 400);

  const { name, code, description, icon } = req.body;

  const updateFields: any = {};
  if (name) updateFields.name = name.trim();
  if (code) updateFields.code = code.toUpperCase().trim();
  if (description !== undefined) updateFields.description = description;
  if (icon) updateFields.icon = icon;

  const department = await Department.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
  if (!department) throw new AppError('Department not found', 404);

  res.json({
    success: true,
    message: 'Department updated',
    data: {
      ...department,
      id: department._id.toString(),
    },
  });
});

export const deleteDepartment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Department ID', 400);

  const hasDoctors = await Doctor.exists({ departmentId: id });
  if (hasDoctors) {
    throw new AppError('Cannot delete department with assigned doctors. Reassign doctors first.', 400);
  }

  await Department.findByIdAndDelete(id);

  res.json({ success: true, message: 'Department deleted successfully' });
});
