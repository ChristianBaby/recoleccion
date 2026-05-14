import mongoose, { Schema, Document } from 'mongoose';

export interface IRouteExecution extends Document {
  route: mongoose.Types.ObjectId;
  operator: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  date: Date;
  startedAt: Date;
  endedAt?: Date;
  status: 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  waypointsVisited: {
    waypoint: number;
    arrivedAt: Date;
    skipped: boolean;
    skipReason?: string;
  }[];
  collectionData: {
    organicKg: number;
    recyclableKg: number;
    nonRecyclableKg: number;
    observations: string;
  };
  delayMinutes: number;
  createdAt: Date;
}

const RouteExecutionSchema = new Schema<IRouteExecution>(
  {
    route: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    operator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    date: { type: Date, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled', 'delayed'],
      default: 'in_progress',
    },
    waypointsVisited: [
      {
        waypoint: { type: Number },
        arrivedAt: { type: Date },
        skipped: { type: Boolean, default: false },
        skipReason: { type: String },
      },
    ],
    collectionData: {
      organicKg: { type: Number, default: 0 },
      recyclableKg: { type: Number, default: 0 },
      nonRecyclableKg: { type: Number, default: 0 },
      observations: { type: String, default: '' },
    },
    delayMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RouteExecutionSchema.index({ route: 1, date: -1 });

export default mongoose.models.RouteExecution ||
  mongoose.model<IRouteExecution>('RouteExecution', RouteExecutionSchema);
