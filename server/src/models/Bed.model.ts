import mongoose, { Document, Schema } from 'mongoose';

export interface IBed extends Document {
  id: string;
  bedNumber: string;
  wardId: mongoose.Types.ObjectId;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE';
  dailyRate: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BedSchema: Schema = new Schema(
  {
    bedNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    wardId: {
      type: Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE'],
      default: 'AVAILABLE',
      required: true,
    },
    dailyRate: {
      type: Number,
      default: 100.0,
    },
    notes: {
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

BedSchema.virtual('ward', {
  ref: 'Ward',
  localField: 'wardId',
  foreignField: '_id',
  justOne: true,
});

BedSchema.virtual('admissions', {
  ref: 'Admission',
  localField: '_id',
  foreignField: 'bedId',
});

export const Bed = mongoose.model<IBed>('Bed', BedSchema);
export default Bed;
