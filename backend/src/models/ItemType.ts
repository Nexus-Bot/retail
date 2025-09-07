import mongoose from 'mongoose';

interface IGrouping {
  groupName: string; // e.g., "bag", "box", "carton"
  unitsPerGroup: number; // e.g., 16 tea packets per bag
  groupWeight?: string; // e.g., "8kg", optional weight description
}

interface IItemType extends mongoose.Document {
  name: string; // e.g., "Tea Packet 500gm"
  description?: string; // Optional description
  grouping?: IGrouping[]; // Multiple grouping levels for bulk operations
  agency: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  getGroupingByName(groupName: string): IGrouping | null;
}

const groupingSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  unitsPerGroup: {
    type: Number,
    required: true,
    min: 1,
  },
  groupWeight: {
    type: String,
    trim: true,
    maxlength: 20,
  }
}, { _id: false });

const itemTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  grouping: [groupingSchema], // Array to support multiple grouping levels
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Method to find grouping by name
itemTypeSchema.methods.getGroupingByName = function(groupName: string): IGrouping | null {
  return this.grouping?.find((g: IGrouping) => g.groupName.toLowerCase() === groupName.toLowerCase()) || null;
};


// Indexes for efficient queries
itemTypeSchema.index({ agency: 1, isActive: 1 });
itemTypeSchema.index({ name: 1, agency: 1 }, { unique: true }); // Unique name per agency

export default mongoose.model<IItemType>('ItemType', itemTypeSchema);