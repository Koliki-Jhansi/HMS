"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getNotifications = (0, error_middleware_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw new error_middleware_1.AppError('Unauthorized', 401);
    const userId = new mongoose_1.default.Types.ObjectId(req.user.id);
    const notifications = await models_1.Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    const unreadCount = await models_1.Notification.countDocuments({ userId, isRead: false });
    res.json({
        success: true,
        unreadCount,
        data: notifications.map((n) => ({
            ...n,
            id: n._id.toString(),
        })),
    });
});
exports.markAsRead = (0, error_middleware_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new error_middleware_1.AppError('Invalid Notification ID', 400);
    await models_1.Notification.updateOne({ _id: new mongoose_1.default.Types.ObjectId(id), userId: new mongoose_1.default.Types.ObjectId(req.user?.id) }, { $set: { isRead: true } });
    res.json({ success: true, message: 'Notification marked as read' });
});
exports.markAllAsRead = (0, error_middleware_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw new error_middleware_1.AppError('Unauthorized', 401);
    await models_1.Notification.updateMany({ userId: new mongoose_1.default.Types.ObjectId(req.user.id), isRead: false }, { $set: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
});
