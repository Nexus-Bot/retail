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
  sellPrice?: number; // Optional sell price for the item
  saleDate?: Date; // Date when item was sold
  returnDate?: Date; // Date when item was returned (if applicable)
  saleTo?: mongoose.Types.ObjectId; // Customer who bought the item
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
    sellPrice: {
      type: Number,
      required: false,
      min: [0, "Sell price must be a positive number"],
    },
    saleDate: {
      type: Date,
      required: false,
    },
    returnDate: {
      type: Date,
      required: false,
    },
    saleTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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




// Optimized indexes for efficient queries - based on common query patterns

// 1. Primary filtering - most common query pattern (agency + status + itemType)
itemSchema.index({ agency: 1, status: 1, itemType: 1 });

// 2. Employee items lookup with status filtering
itemSchema.index({ currentHolder: 1, status: 1 });

// 3. Analytics queries - sales by date range
itemSchema.index({ agency: 1, status: 1, saleDate: -1 });

// 4. Analytics queries - returns by date range  
itemSchema.index({ agency: 1, status: 1, returnDate: -1 });

// 5. Revenue analytics - sellPrice with date filtering
itemSchema.index({ sellPrice: 1, saleDate: -1, agency: 1 });

// 6. Recent items by type (inventory management)
itemSchema.index({ agency: 1, itemType: 1, createdAt: -1 });

// 7. Complex filtering for getItems() endpoint
itemSchema.index({ agency: 1, status: 1, itemType: 1, currentHolder: 1 });

// 8. Customer sales history
itemSchema.index({ saleTo: 1, saleDate: -1 });

// 9. User activity tracking
itemSchema.index({ createdBy: 1, createdAt: -1 });

// 10. Analytics aggregation support - itemType with status and dates
itemSchema.index({ itemType: 1, agency: 1, status: 1, saleDate: -1 });

export default mongoose.model<IItem>("Item", itemSchema);
