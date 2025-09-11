import mongoose from 'mongoose';

const agencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
agencySchema.index({ status: 1 });          // Status-based filtering
agencySchema.index({ createdAt: -1 });      // Recent agencies sorting
agencySchema.index({ createdBy: 1 });       // Created by queries

export default mongoose.model('Agency', agencySchema);