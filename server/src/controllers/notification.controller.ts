import { Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { catchAsync, AppError } from '../middleware/error.middleware';

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);

  const userId = new mongoose.Types.ObjectId(req.user.id);

  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  res.json({
    success: true,
    unreadCount,
    data: notifications.map((n: any) => ({
      ...n,
      id: n._id.toString(),
    })),
  });
});

export const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notification ID', 400);

  await Notification.updateOne(
    { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(req.user?.id) },
    { $set: { isRead: true } }
  );

  res.json({ success: true, message: 'Notification marked as read' });
});

export const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);

  await Notification.updateMany(
    { userId: new mongoose.Types.ObjectId(req.user.id), isRead: false },
    { $set: { isRead: true } }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});
