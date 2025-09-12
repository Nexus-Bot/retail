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




// Indexes for efficient queries
itemSchema.index({ agency: 1, status: 1 });              // Primary filtering (most common)
itemSchema.index({ currentHolder: 1 });                  // Employee items lookup
itemSchema.index({ itemType: 1 });                       // Type-based queries
itemSchema.index({ createdAt: -1 });                     // Recent items sorting
itemSchema.index({ status: 1, itemType: 1 });           // Status + type queries  
itemSchema.index({ agency: 1, itemType: 1, status: 1 }); // Complex filtering
itemSchema.index({ createdBy: 1 });
itemSchema.index({ saleDate: -1, agency: 1 });          // Sales analytics by date
itemSchema.index({ returnDate: -1, agency: 1 });        // Return analytics by date
itemSchema.index({ saleTo: 1 });                         // Customer-based sales queries

export default mongoose.model<IItem>("Item", itemSchema);
