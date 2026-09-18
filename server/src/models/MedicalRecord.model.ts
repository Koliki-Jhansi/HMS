import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalRecord extends Document {
  id: string;
  recordNumber: string;
  patientId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  title: string;
  recordType: 'CONSULTATION' | 'LAB_REPORT' | 'SURGERY' | 'DISCHARGE_SUMMARY' | 'DIAGNOSIS';
  notes: string;
  attachments?: string;
  recordDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema: Schema = new Schema(
  {
    recordNumber: {
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
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    recordType: {
      type: String,
      enum: ['CONSULTATION', 'LAB_REPORT', 'SURGERY', 'DISCHARGE_SUMMARY', 'DIAGNOSIS'],
      default: 'CONSULTATION',
      required: true,
    },
    notes: {
      type: String,
      required: true,
    },
    attachments: {
      type: String,
    },
    recordDate: {
      type: String,
      required: true,
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

MedicalRecordSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

MedicalRecordSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true,
});

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
export default MedicalRecord;
