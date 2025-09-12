import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  mobile: string;
  route: Schema.Types.ObjectId;
  agency: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Customer name must be at least 2 characters'],
    maxlength: [100, 'Customer name must not exceed 100 characters'],
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        // Basic mobile number validation (10-15 digits)
        return /^\+?[\d\s\-()]{10,15}$/.test(v);
      },
      message: 'Please enter a valid mobile number',
    },
  },
  route: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required'],
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

// Ensure mobile numbers are unique within an agency
customerSchema.index({ mobile: 1, agency: 1 }, { unique: true });

// Add text index for search functionality
customerSchema.index({ name: 'text', mobile: 'text' });

// Index for efficient route-based queries
customerSchema.index({ route: 1, agency: 1 });

export const Customer = model<ICustomer>('Customer', customerSchema);