import mongoose, { Schema, Document } from 'mongoose';

export interface IWasteType extends Document {
  name: string;
  category: 'organic' | 'recyclable' | 'non_recyclable' | 'hazardous';
  description: string;
  examples: string[];
  handlingInstructions: string;
  colorCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WasteTypeSchema = new Schema<IWasteType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ['organic', 'recyclable', 'non_recyclable', 'hazardous'],
      required: true,
    },
    description: { type: String, required: true },
    examples: [{ type: String }],
    handlingInstructions: { type: String, required: true },
    colorCode: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.WasteType || mongoose.model<IWasteType>('WasteType', WasteTypeSchema);
