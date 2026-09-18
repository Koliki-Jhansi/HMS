import { Response } from 'express';
import mongoose from 'mongoose';
import { Ward, Bed, Admission } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getWards = catchAsync(async (req: AuthRequest, res: Response) => {
  const wards = await Ward.find().sort({ floor: 1, name: 1 }).lean();

  const formattedWards = await Promise.all(
    wards.map(async (w: any) => {
      const beds = await Bed.find({ wardId: w._id }).lean();

      const bedsWithAdmissions = await Promise.all(
        beds.map(async (b: any) => {
          const activeAdmission = await Admission.findOne({
            bedId: b._id,
            status: 'ACTIVE',
          })
            .populate({
              path: 'patientId',
              populate: { path: 'userId', select: 'name phone' },
            })
            .populate({
              path: 'admittingDoctorId',
              populate: { path: 'userId', select: 'name' },
            })
            .lean();

          return {
            ...b,
            id: b._id.toString(),
            admissions: activeAdmission
              ? [
                  {
                    ...activeAdmission,
                    id: activeAdmission._id.toString(),
                    patient: activeAdmission.patientId
                      ? {
                          ...(activeAdmission.patientId as any),
                          id: (activeAdmission.patientId as any)._id.toString(),
                          user: (activeAdmission.patientId as any).userId,
                        }
                      : null,
                    doctor: activeAdmission.admittingDoctorId
                      ? {
                          ...(activeAdmission.admittingDoctorId as any),
                          id: (activeAdmission.admittingDoctorId as any)._id.toString(),
                          user: (activeAdmission.admittingDoctorId as any).userId,
                        }
                      : null,
                  },
                ]
              : [],
          };
        })
      );

      const total = bedsWithAdmissions.length;
      const available = bedsWithAdmissions.filter((b) => b.status === 'AVAILABLE').length;
      const occupied = bedsWithAdmissions.filter((b) => b.status === 'OCCUPIED').length;
      const reserved = bedsWithAdmissions.filter((b) => b.status === 'RESERVED').length;
      const cleaning = bedsWithAdmissions.filter((b) => b.status === 'CLEANING').length;
      const maintenance = bedsWithAdmissions.filter((b) => b.status === 'MAINTENANCE').length;
      const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

      return {
        ...w,
        id: w._id.toString(),
        beds: bedsWithAdmissions,
        stats: {
          total,
          available,
          occupied,
          reserved,
          cleaning,
          maintenance,
          occupancyRate,
        },
      };
    })
  );

  res.json({ success: true, data: formattedWards });
});

export const createWard = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, code, type, floor, capacity, description } = req.body;

  if (!name || !code) throw new AppError('Ward name and code are required', 400);

  const existing = await Ward.findOne({
    $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
  });

  if (existing) throw new AppError('Ward with this name or code already exists', 400);

  const ward = await Ward.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    type: type || 'GENERAL',
    floor: Number(floor) || 1,
    capacity: Number(capacity) || 10,
    description,
  });

  res.status(201).json({
    success: true,
    message: 'Ward created successfully',
    data: {
      ...ward.toJSON(),
      id: ward._id.toString(),
    },
  });
});

export const updateWard = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Ward ID', 400);

  const { name, code, type, floor, capacity, description } = req.body;

  const updateFields: any = {};
  if (name) updateFields.name = name.trim();
  if (code) updateFields.code = code.toUpperCase().trim();
  if (type) updateFields.type = type;
  if (floor !== undefined) updateFields.floor = Number(floor);
  if (capacity !== undefined) updateFields.capacity = Number(capacity);
  if (description !== undefined) updateFields.description = description;

  const ward = await Ward.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
  if (!ward) throw new AppError('Ward not found', 404);

  res.json({
    success: true,
    message: 'Ward updated successfully',
    data: {
      ...ward,
      id: ward._id.toString(),
    },
  });
});

export const deleteWard = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Ward ID', 400);

  // Check if any beds in this ward have active admissions
  const wardBeds = await Bed.find({ wardId: id }).distinct('_id');
  const activeAdmissions = await Admission.exists({
    bedId: { $in: wardBeds },
    status: 'ACTIVE',
  });

  if (activeAdmissions) {
    throw new AppError('Cannot delete ward with active patient admissions', 400);
  }

  // Delete all beds associated with ward
  await Bed.deleteMany({ wardId: id });
  await Ward.findByIdAndDelete(id);

  res.json({ success: true, message: 'Ward and its beds deleted successfully' });
});
