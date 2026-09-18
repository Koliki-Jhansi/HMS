import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmission extends Document {
  id: string;
  admissionNumber: string;
  patientId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  admittingDoctorId: mongoose.Types.ObjectId;
  admissionDate: Date;
  dischargeDate?: Date;
  reason: string;
  diagnosis?: string;
  status: 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED';
  dischargeSummary?: string;
  totalBill?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionSchema: Schema = new Schema(
  {
    admissionNumber: {
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
    bedId: {
      type: Schema.Types.ObjectId,
      ref: 'Bed',
      required: true,
    },
    admittingDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    dischargeDate: {
      type: Date,
    },
    reason: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISCHARGED', 'TRANSFERRED'],
      default: 'ACTIVE',
    },
    dischargeSummary: {
      type: String,
    },
    totalBill: {
      type: Number,
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

AdmissionSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

AdmissionSchema.virtual('bed', {
  ref: 'Bed',
  localField: 'bedId',
  foreignField: '_id',
  justOne: true,
});

AdmissionSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'admittingDoctorId',
  foreignField: '_id',
  justOne: true,
});

export const Admission = mongoose.model<IAdmission>('Admission', AdmissionSchema);
export default Admission;
