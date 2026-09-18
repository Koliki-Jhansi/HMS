import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctorSchedule extends Document {
  id: string;
  doctorId: mongoose.Types.ObjectId;
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  startTime: string; // '09:00'
  endTime: string; // '17:00'
  slotDurationMinutes: number; // 30
  maxPatientsPerSlot: number; // 1
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorScheduleSchema: Schema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: {
      type: String,
      required: true,
      default: '09:00',
    },
    endTime: {
      type: String,
      required: true,
      default: '17:00',
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
    },
    maxPatientsPerSlot: {
      type: Number,
      default: 1,
    },
    isAvailable: {
      type: Boolean,
      default: true,
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

DoctorScheduleSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true,
});

export const DoctorSchedule = mongoose.model<IDoctorSchedule>('DoctorSchedule', DoctorScheduleSchema);
export default DoctorSchedule;
