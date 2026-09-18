import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'ADMISSION' | 'PRESCRIPTION' | 'SYSTEM' | 'BED';
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['APPOINTMENT', 'ADMISSION', 'PRESCRIPTION', 'SYSTEM', 'BED'],
      default: 'SYSTEM',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
