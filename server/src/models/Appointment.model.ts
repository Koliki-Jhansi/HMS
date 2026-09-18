import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  id: string;
  appointmentNumber: string;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. 10:00 AM
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  reason: string;
  symptoms?: string;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    appointmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    appointmentDate: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    symptoms: {
      type: String,
    },
    notes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    cancellationReason: {
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

AppointmentSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

AppointmentSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true,
});

AppointmentSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

AppointmentSchema.virtual('prescription', {
  ref: 'Prescription',
  localField: '_id',
  foreignField: 'appointmentId',
  justOne: true,
});

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export default Appointment;
