import mongoose from "mongoose";

export enum ItemStatus {
  IN_INVENTORY = "in_inventory",
  WITH_EMPLOYEE = "with_employee",
  SOLD = "sold",
}

interface IStatusHistory {
  status: ItemStatus;
  date: Date;
  changedBy: mongoose.Types.ObjectId;
  currentHolder?: mongoose.Types.ObjectId; // For when status is 'with_employee'
  notes?: string;
}

interface IItem extends mongoose.Document {
  itemType: mongoose.Types.ObjectId; // Reference to ItemType
  status: ItemStatus;
  agency: mongoose.Types.ObjectId;
  currentHolder?: mongoose.Types.ObjectId; // Current holder if status is 'with_employee'
  statusHistory: IStatusHistory[];
  createdBy: mongoose.Types.ObjectId;
  addStatusChange(
    status: ItemStatus,
    changedBy: string,
    currentHolder?: string,
    notes?: string
  ): void;
  getCurrentStatusInfo(): IStatusHistory | null;
}

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(ItemStatus),
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currentHolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    itemType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemType",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ItemStatus),
      default: ItemStatus.IN_INVENTORY,
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    currentHolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    statusHistory: [statusHistorySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to add status change to history
itemSchema.methods.addStatusChange = function (
  status: ItemStatus,
  changedBy: string,
  currentHolder?: string,
  notes?: string
): void {
  this.status = status;

  // Set currentHolder based on status
  if (status === ItemStatus.WITH_EMPLOYEE) {
    this.currentHolder = currentHolder;
  } else if (status === ItemStatus.IN_INVENTORY) {
    this.currentHolder = undefined;
  }
  // For SOLD status, preserve the existing currentHolder

  this.statusHistory.push({
    status,
    date: new Date(),
    changedBy,
    currentHolder:
      status === ItemStatus.WITH_EMPLOYEE
        ? currentHolder
        : status === ItemStatus.SOLD
        ? this.currentHolder
        : undefined,
    notes,
  });
};

// Method to get current status information
itemSchema.methods.getCurrentStatusInfo = function (): IStatusHistory | null {
  return this.statusHistory.length > 0
    ? this.statusHistory[this.statusHistory.length - 1]
    : null;
};

// Middleware to add initial status to history when item is created
itemSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      changedBy: this.createdBy,
      notes: "Item created",
    });
  }
  next();
});

// Index for efficient queries
itemSchema.index({ agency: 1, status: 1 });
itemSchema.index({ currentHolder: 1 });
itemSchema.index({ itemType: 1 });
itemSchema.index({ createdAt: -1 });

export default mongoose.model<IItem>("Item", itemSchema);
