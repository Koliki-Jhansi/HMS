import { Response } from 'express';
import mongoose from 'mongoose';
import { Bed, Ward, Admission } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getBeds = catchAsync(async (req: AuthRequest, res: Response) => {
  const { wardId, status, type, search } = req.query;

  const query: any = {};

  if (wardId && wardId !== 'ALL') {
    if (mongoose.Types.ObjectId.isValid(String(wardId))) {
      query.wardId = new mongoose.Types.ObjectId(String(wardId));
    }
  }

  if (status && status !== 'ALL') {
    query.status = String(status);
  }

  if (search) {
    query.bedNumber = { $regex: String(search), $options: 'i' };
  }

  let beds = await Bed.find(query)
    .populate('wardId')
    .sort({ bedNumber: 1 })
    .lean();

  if (type && type !== 'ALL') {
    beds = beds.filter((b: any) => b.wardId?.type === type);
  }

  const bedsWithAdmissions = await Promise.all(
    beds.map(async (b: any) => {
      const activeAdmission = await Admission.findOne({
        bedId: b._id,
        status: 'ACTIVE',
      })
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name phone email avatar' },
        })
        .populate({
          path: 'admittingDoctorId',
          populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId' }],
        })
        .lean();

      return {
        ...b,
        id: b._id.toString(),
        ward: b.wardId
          ? {
              ...b.wardId,
              id: b.wardId._id ? b.wardId._id.toString() : b.wardId.toString(),
            }
          : null,
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
                      department: (activeAdmission.admittingDoctorId as any).departmentId,
                    }
                  : null,
              },
            ]
          : [],
      };
    })
  );

  res.json({ success: true, count: bedsWithAdmissions.length, data: bedsWithAdmissions });
});

export const getBedById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Bed ID', 400);

  const bed = await Bed.findById(id).populate('wardId').lean();
  if (!bed) throw new AppError('Bed not found', 404);

  const admissions = await Admission.find({ bedId: bed._id })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name phone' },
    })
    .populate({
      path: 'admittingDoctorId',
      populate: { path: 'userId', select: 'name' },
    })
    .sort({ admissionDate: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      ...bed,
      id: bed._id.toString(),
      ward: bed.wardId,
      admissions: admissions.map((adm: any) => ({
        ...adm,
        id: adm._id.toString(),
        patient: adm.patientId
          ? {
              ...(adm.patientId as any),
              id: (adm.patientId as any)._id.toString(),
              user: (adm.patientId as any).userId,
            }
          : null,
        doctor: adm.admittingDoctorId
          ? {
              ...(adm.admittingDoctorId as any),
              id: (adm.admittingDoctorId as any)._id.toString(),
              user: (adm.admittingDoctorId as any).userId,
            }
          : null,
      })),
    },
  });
});

export const createBed = catchAsync(async (req: AuthRequest, res: Response) => {
  const { bedNumber, wardId, status, dailyRate, notes } = req.body;

  if (!bedNumber || !wardId) {
    throw new AppError('Bed number and ward are required', 400);
  }

  const existing = await Bed.findOne({ bedNumber: bedNumber.trim() });
  if (existing) {
    throw new AppError(`Bed number "${bedNumber}" already exists`, 400);
  }

  const bed = await Bed.create({
    bedNumber: bedNumber.trim(),
    wardId: new mongoose.Types.ObjectId(wardId),
    status: status || 'AVAILABLE',
    dailyRate: dailyRate !== undefined ? Number(dailyRate) : 100.0,
    notes,
  });

  const populated = await Bed.findById(bed._id).populate('wardId').lean();

  res.status(201).json({
    success: true,
    message: 'Bed created successfully',
    data: {
      ...populated,
      id: populated?._id.toString(),
      ward: populated?.wardId,
    },
  });
});

export const updateBedStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Bed ID', 400);

  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  // Prevent changing status from OCCUPIED if there is an active admission
  if (status !== 'OCCUPIED') {
    const activeAdm = await Admission.findOne({ bedId: id, status: 'ACTIVE' });
    if (activeAdm) {
      throw new AppError(
        'Cannot change bed status while patient is actively admitted. Please discharge the patient first.',
        400
      );
    }
  }

  const updateFields: any = { status };
  if (notes !== undefined) updateFields.notes = notes;

  const bed = await Bed.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
    .populate('wardId')
    .lean();

  if (!bed) throw new AppError('Bed not found', 404);

  res.json({
    success: true,
    message: `Bed status updated to ${status}`,
    data: {
      ...bed,
      id: bed._id.toString(),
      ward: bed.wardId,
    },
  });
});

export const updateBedDetails = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { bedNumber, wardId, dailyRate, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Bed ID', 400);

  const updateFields: any = {};
  if (bedNumber) updateFields.bedNumber = bedNumber.trim();
  if (wardId) updateFields.wardId = new mongoose.Types.ObjectId(wardId);
  if (dailyRate !== undefined) updateFields.dailyRate = Number(dailyRate);
  if (notes !== undefined) updateFields.notes = notes;

  const bed = await Bed.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
    .populate('wardId')
    .lean();

  if (!bed) throw new AppError('Bed not found', 404);

  res.json({
    success: true,
    message: 'Bed details updated',
    data: {
      ...bed,
      id: bed._id.toString(),
      ward: bed.wardId,
    },
  });
});

export const deleteBed = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Bed ID', 400);

  const activeAdm = await Admission.findOne({ bedId: id, status: 'ACTIVE' });
  if (activeAdm) {
    throw new AppError('Cannot delete a bed with an active admission', 400);
  }

  await Bed.findByIdAndDelete(id);

  res.json({ success: true, message: 'Bed deleted successfully' });
});

export const getBedStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const [total, available, occupied, reserved, cleaning, maintenance] = await Promise.all([
    Bed.countDocuments(),
    Bed.countDocuments({ status: 'AVAILABLE' }),
    Bed.countDocuments({ status: 'OCCUPIED' }),
    Bed.countDocuments({ status: 'RESERVED' }),
    Bed.countDocuments({ status: 'CLEANING' }),
    Bed.countDocuments({ status: 'MAINTENANCE' }),
  ]);

  const wards = await Ward.find().lean();
  const wardBreakdown = await Promise.all(
    wards.map(async (w: any) => {
      const wardBeds = await Bed.find({ wardId: w._id }).lean();
      return {
        wardId: w._id.toString(),
        wardName: w.name,
        type: w.type,
        floor: w.floor,
        total: wardBeds.length,
        available: wardBeds.filter((b) => b.status === 'AVAILABLE').length,
        occupied: wardBeds.filter((b) => b.status === 'OCCUPIED').length,
      };
    })
  );

  res.json({
    success: true,
    data: {
      total,
      available,
      occupied,
      reserved,
      cleaning,
      maintenance,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      wardBreakdown,
    },
  });
});
