import { Schema, model, Document } from 'mongoose';

export interface IRoute extends Document {
  name: string;
  agency: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const routeSchema = new Schema<IRoute>({
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    minlength: [2, 'Route name must be at least 2 characters'],
    maxlength: [50, 'Route name must not exceed 50 characters'],
  },
  agency: {
    type: Schema.Types.ObjectId,
    ref: 'Agency',
    required: [true, 'Agency is required'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required'],
  },
}, {
  timestamps: true,
});

// Ensure route names are unique within an agency
routeSchema.index({ name: 1, agency: 1 }, { unique: true });

// Add text index for search functionality
routeSchema.index({ name: 'text' });

export const Route = model<IRoute>('Route', routeSchema);