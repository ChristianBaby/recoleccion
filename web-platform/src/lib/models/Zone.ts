import mongoose, { Schema, Document } from 'mongoose';

export interface IZone extends Document {
  name: string;
  description: string;
  district: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  color: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema = new Schema<IZone>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    geometry: {
      type: { type: String, enum: ['Polygon'], required: true, default: 'Polygon' },
      coordinates: { type: [[[Number]]], required: true },
    },
    color: { type: String, default: '#10B981' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ZoneSchema.index({ geometry: '2dsphere' });

export default mongoose.models.Zone || mongoose.model<IZone>('Zone', ZoneSchema);
