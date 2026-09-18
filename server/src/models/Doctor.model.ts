import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  specialization: string;
  licenseNumber: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  departmentId?: mongoose.Types.ObjectId;
  bio?: string;
  availableDays: string;
  timeSlots: string;
  roomNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 1,
    },
    consultationFee: {
      type: Number,
      default: 50.0,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    bio: {
      type: String,
    },
    availableDays: {
      type: String,
      default: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    },
    timeSlots: {
      type: String,
      default: '09:00 AM,10:00 AM,11:00 AM,02:00 PM,03:00 PM,04:00 PM',
    },
    roomNumber: {
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

DoctorSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

DoctorSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
export default Doctor;
