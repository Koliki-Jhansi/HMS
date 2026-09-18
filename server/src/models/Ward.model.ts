import mongoose, { Document, Schema } from 'mongoose';

export interface IWard extends Document {
  id: string;
  name: string;
  code: string;
  type: 'GENERAL' | 'ICU' | 'EMERGENCY' | 'PRIVATE' | 'SEMI_PRIVATE' | 'MATERNITY' | 'PEDIATRIC';
  floor: number;
  capacity: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WardSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['GENERAL', 'ICU', 'EMERGENCY', 'PRIVATE', 'SEMI_PRIVATE', 'MATERNITY', 'PEDIATRIC'],
      default: 'GENERAL',
    },
    floor: {
      type: Number,
      default: 1,
    },
    capacity: {
      type: Number,
      default: 10,
    },
    description: {
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

WardSchema.virtual('beds', {
  ref: 'Bed',
  localField: '_id',
  foreignField: 'wardId',
});

export const Ward = mongoose.model<IWard>('Ward', WardSchema);
export default Ward;
