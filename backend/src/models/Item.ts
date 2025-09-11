import mongoose from "mongoose";

export enum ItemStatus {
  IN_INVENTORY = "in_inventory",
  WITH_EMPLOYEE = "with_employee",
  SOLD = "sold",
}


interface IItem extends mongoose.Document {
  itemType: mongoose.Types.ObjectId; // Reference to ItemType
  status: ItemStatus;
  agency: mongoose.Types.ObjectId;
  currentHolder?: mongoose.Types.ObjectId; // Current holder if status is 'with_employee'
  createdBy: mongoose.Types.ObjectId;
}


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




// Index for efficient queries
itemSchema.index({ agency: 1, status: 1 });
itemSchema.index({ currentHolder: 1 });
itemSchema.index({ itemType: 1 });
itemSchema.index({ createdAt: -1 });

export default mongoose.model<IItem>("Item", itemSchema);
