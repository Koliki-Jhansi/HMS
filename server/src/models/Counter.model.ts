import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
  name: string;
  seq: number;
}

const CounterSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
export default Counter;
