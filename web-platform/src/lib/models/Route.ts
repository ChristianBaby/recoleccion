import mongoose, { Schema, Document } from 'mongoose';

export interface IRoute extends Document {
  name: string;
  zone: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  operator: mongoose.Types.ObjectId;
  wasteTypes: mongoose.Types.ObjectId[];
  schedule: {
    dayOfWeek: number[];
    startTime: string;
    estimatedDuration: number;
  };
  waypoints: {
    order: number;
    name: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    estimatedArrival: string;
  }[];
  path: {
    type: 'LineString';
    coordinates: number[][];
  };
  status: 'active' | 'inactive' | 'draft';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RouteSchema = new Schema<IRoute>(
  {
    name: { type: String, required: true, trim: true },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    operator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wasteTypes: [{ type: Schema.Types.ObjectId, ref: 'WasteType' }],
    schedule: {
      dayOfWeek: [{ type: Number }],
      startTime: { type: String, required: true },
      estimatedDuration: { type: Number, required: true },
    },
    waypoints: [
      {
        order: { type: Number, required: true },
        name: { type: String, required: true },
        location: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: { type: [Number], required: true },
        },
        estimatedArrival: { type: String },
      },
    ],
    path: {
      type: { type: String, enum: ['LineString'], default: 'LineString' },
      coordinates: { type: [[Number]] },
    },
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

RouteSchema.index({ zone: 1 });
RouteSchema.index({ operator: 1 });

export default mongoose.models.Route || mongoose.model<IRoute>('Route', RouteSchema);
