import { Request, Response } from "express";
import mongoose from "mongoose";
import Item, { ItemStatus } from "../models/Item";
import ItemType from "../models/ItemType";
import User from "../models/User";
import { UserRole } from "../types/auth";

interface UpdateItemOptions {
  status?: ItemStatus;
  currentHolder?: string;
}

const updateSingleItem = async (
  item: any,
  updateOptions: UpdateItemOptions,
  currentUser: any
) => {
  const { status, currentHolder } = updateOptions;

  // Validate status if provided
  if (status !== undefined) {
    if (!Object.values(ItemStatus).includes(status)) {
      throw new Error("Invalid status");
    }

    // Business logic for status transitions
    if (item.status === ItemStatus.SOLD) {
      // Employees can only change SOLD to WITH_EMPLOYEE
      if (currentUser?.role === UserRole.EMPLOYEE) {
        if (status !== ItemStatus.WITH_EMPLOYEE) {
          throw new Error(
            "Employees can only change sold items to with_employee status"
          );
        }
      }

      // Prevent redundant status update
      if (status === ItemStatus.SOLD) {
        throw new Error("Item is already sold");
      }
    }

    // If assigning to employee, validate the employee exists and belongs to same agency
    if (status === ItemStatus.WITH_EMPLOYEE) {
      if (!currentHolder) {
        throw new Error(
          "Employee ID is required when assigning item to employee"
        );
      }

      const employee = await User.findById(currentHolder);
      if (!employee || employee.role !== UserRole.EMPLOYEE) {
        throw new Error("Invalid employee");
      }

      if (employee.agency?.toString() !== item.agency.toString()) {
        throw new Error("Employee must belong to the same agency");
      }
    }

  }


  // Handle status change
  if (status !== undefined) {
    item.status = status;
    
    // Set currentHolder based on status
    if (status === ItemStatus.WITH_EMPLOYEE) {
      item.currentHolder = currentHolder;
    } else if (status === ItemStatus.IN_INVENTORY) {
      item.currentHolder = undefined;
    }
    // For SOLD status, preserve the existing currentHolder
  }

  await item.save();
  return item;
};

export const createItems = async (req: Request, res: Response) => {
  try {
    const {
      itemTypeId,
      quantity,
      groupQuantity,
      groupName,
    } = req.body;
    const currentUser = req.user;

    if (!itemTypeId) {
      return res.status(400).json({
        success: false,
        message: "Item type is required",
      });
    }


    // Only owners can create items
    if (currentUser?.role !== UserRole.OWNER) {
      return res.status(403).json({
        success: false,
        message: "Only agency owners can add items to inventory",
      });
    }

    // Validate item type exists and belongs to agency
    const itemType = await ItemType.findById(itemTypeId);
    if (!itemType || itemType.agency.toString() !== currentUser.agencyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid item type or not from your agency",
      });
    }

    // Calculate number of items to create
    let itemsToCreate = quantity || 1;
    if (groupQuantity && groupName) {
      const grouping = itemType.getGroupingByName(groupName);
      if (!grouping) {
        return res.status(400).json({
          success: false,
          message: `Grouping "${groupName}" not found in item type`,
        });
      }
      itemsToCreate = groupQuantity * grouping.unitsPerGroup;
    }

    if (itemsToCreate < 1) {
      return res.status(400).json({
        success: false,
        message: "Must create at least 1 item",
      });
    }

    // Create multiple items
    const items = [];
    for (let i = 0; i < itemsToCreate; i++) {
      const itemData: any = {
        itemType: itemTypeId,
        agency: currentUser.agencyId,
        createdBy: currentUser.id,
      };

      const item = new Item(itemData);
      items.push(item);
    }

    // Save all items
    const savedItems = await Item.insertMany(items);

    // Populate the first few items for response
    const populatedItems = await Item.find({
      _id: { $in: savedItems.map((item) => item._id) },
    })
      .populate("itemType", "name grouping description")
      .populate("agency", "name")
      .populate("createdBy", "username")
      .limit(5); // Only return first 5 items to avoid large responses

    return res.status(201).json({
      success: true,
      message: `${itemsToCreate} items added to inventory successfully`,
      data: {
        itemsCreated: itemsToCreate,
        sampleItems: populatedItems,
        totalItems: savedItems.length,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        error,
        success: false,
        message: "Duplicate serial number found",
      });
    }

    console.error("Create items error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 10, status, itemTypeId } = req.query;

    const filter: any = {};

    // Role-based filtering
    if (
      currentUser?.role === UserRole.OWNER ||
      currentUser?.role === UserRole.EMPLOYEE
    ) {
      filter.agency = new mongoose.Types.ObjectId(currentUser.agencyId);
    }

    if (status) filter.status = status;
    if (itemTypeId) filter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);

    const skip = (Number(page) - 1) * Number(limit);

    // Single aggregation for both data and count
    const results = await Item.aggregate([
      { $match: filter },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: "itemtypes",
                localField: "itemType",
                foreignField: "_id",
                as: "itemType",
                pipeline: [{ $project: { name: 1, grouping: 1, description: 1 } }]
              }
            },
            {
              $lookup: {
                from: "agencies",
                localField: "agency",
                foreignField: "_id",
                as: "agency",
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { username: 1 } }]
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "currentHolder",
                foreignField: "_id",
                as: "currentHolder",
                pipeline: [{ $project: { username: 1 } }]
              }
            },
            {
              $addFields: {
                itemType: { $arrayElemAt: ["$itemType", 0] },
                agency: { $arrayElemAt: ["$agency", 0] },
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
                currentHolder: { $arrayElemAt: ["$currentHolder", 0] }
              }
            }
          ],
          count: [{ $count: "total" }]
        }
      }
    ]);

    const items = results[0].data;
    const total = results[0].count[0]?.total || 0;

    // Get summary by item type - use separate filter for summary (exclude limit-related filters)
    const summaryFilter: any = {};
    
    // Role-based filtering for summary
    if (
      currentUser?.role === UserRole.OWNER ||
      currentUser?.role === UserRole.EMPLOYEE
    ) {
      summaryFilter.agency = new mongoose.Types.ObjectId(currentUser.agencyId);
    }

    // Only include status and itemType filters for summary, not pagination
    if (status) summaryFilter.status = status;
    if (itemTypeId) summaryFilter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);

    const summary = await Item.aggregate([
      { $match: summaryFilter },
      {
        $group: {
          _id: { itemType: "$itemType", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "itemtypes",
          localField: "_id.itemType",
          foreignField: "_id",
          as: "itemType",
        },
      },
      {
        $group: {
          _id: "$_id.itemType",
          itemTypeName: { $first: { $arrayElemAt: ["$itemType.name", 0] } },
          statusCounts: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
    ]);

    return res.json({
      success: true,
      data: items,
      summary,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get items error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const item = await Item.findById(id)
      .populate("itemType", "name grouping description")
      .populate("agency", "name")
      .populate("createdBy", "username")
      .populate("currentHolder", "username");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Role-based access control
    if (
      currentUser?.role !== UserRole.MASTER &&
      item.agency._id.toString() !== currentUser?.agencyId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get item error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const bulkUpdateItems = async (req: Request, res: Response) => {
  try {
    const {
      itemTypeId,
      status,
      currentHolder,
      quantity,
      groupQuantity,
      groupName,
      currentStatus,
    } = req.body;
    const currentUser = req.user;

    if (!itemTypeId) {
      return res.status(400).json({
        success: false,
        message: "Item type ID is required",
      });
    }

    // Validate item type exists and belongs to agency
    const itemType = await ItemType.findById(itemTypeId);
    if (!itemType || itemType.agency.toString() !== currentUser?.agencyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid item type or not from your agency",
      });
    }

    // Calculate number of items to update
    let itemsToUpdate = quantity || 1;
    if (groupQuantity && groupName) {
      const grouping = itemType.getGroupingByName(groupName);
      if (!grouping) {
        return res.status(400).json({
          success: false,
          message: `Grouping "${groupName}" not found in item type`,
        });
      }
      itemsToUpdate = groupQuantity * grouping.unitsPerGroup;
    }

    // Build filter for items to update
    const filter: any = {
      itemType: itemTypeId,
      agency: currentUser?.agencyId,
    };

    // Filter by current status if provided
    if (currentStatus) {
      filter.status = currentStatus;
    }

    // Employee access control
    if (currentUser?.role === UserRole.EMPLOYEE) {
      filter.currentHolder = currentUser.id;
    }

    // Find items to update
    const itemsFound = await Item.find(filter).limit(itemsToUpdate);

    if (itemsFound.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No items found matching criteria",
      });
    }

    if (itemsFound.length < itemsToUpdate) {
      return res.status(400).json({
        success: false,
        message: `Only ${itemsFound.length} items available, requested ${itemsToUpdate}`,
      });
    }

    // Validate business rules before bulk update
    const updateData: any = {};
    if (status) {
      // Validate status transitions for all items
      for (const item of itemsFound) {
        if (item.status === ItemStatus.SOLD) {
          if (currentUser?.role === UserRole.EMPLOYEE && status !== ItemStatus.WITH_EMPLOYEE) {
            return res.status(400).json({
              success: false,
              message: "Employees can only change sold items to with_employee status",
            });
          }
          if (status === ItemStatus.SOLD) {
            return res.status(400).json({
              success: false,
              message: "Item is already sold",
            });
          }
        }
      }
      updateData.status = status;
    }

    if (currentHolder) {
      if (status === ItemStatus.WITH_EMPLOYEE) {
        // Validate employee exists and belongs to same agency
        const employee = await User.findById(currentHolder);
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: "Employee not found",
          });
        }
        if (employee.agency?.toString() !== currentUser?.agencyId) {
          return res.status(400).json({
            success: false,
            message: "Employee not in your agency",
          });
        }
      }
      updateData.currentHolder = status === ItemStatus.WITH_EMPLOYEE ? currentHolder : null;
    }

    updateData.updatedAt = new Date();

    // Perform bulk update - single database operation
    const itemIds = itemsFound.map(item => item._id);
    const bulkUpdateResult = await Item.updateMany(
      { _id: { $in: itemIds } },
      { $set: updateData }
    );

    if (bulkUpdateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No items were updated",
      });
    }

    // Populate updated items for response
    const populatedItems = await Item.find({
      _id: { $in: itemIds },
    })
      .populate("itemType", "name grouping description")
      .populate("agency", "name")
      .populate("createdBy", "username")
      .populate("currentHolder", "username")
      .limit(5); // Limit response size for large bulk operations

    return res.json({
      success: true,
      message: `${bulkUpdateResult.modifiedCount} items updated successfully`,
      data: {
        itemsUpdated: bulkUpdateResult.modifiedCount,
        sampleItems: populatedItems,
        totalItemsRequested: itemsToUpdate,
      },
    });
  } catch (error) {
    console.error("Bulk update items error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, currentHolder } = req.body;
    const currentUser = req.user;

    const item = await Item.findById(id).populate("itemType");
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Role-based access control
    if (
      currentUser?.role !== UserRole.MASTER &&
      item.agency.toString() !== currentUser?.agencyId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Business rule: Only the current holder or owner can modify items
    if (currentUser?.role === UserRole.EMPLOYEE) {
      if (item.currentHolder?.toString() !== currentUser.id) {
        return res.status(403).json({
          success: false,
          message: "Employees can only modify items they currently hold",
        });
      }

    }

    // Use the utility function to update the item
    await updateSingleItem(
      item,
      { status, currentHolder },
      currentUser
    );

    await item.populate("itemType", "name grouping description");
    await item.populate("agency", "name");
    await item.populate("createdBy", "username");
    await item.populate("currentHolder", "username");

    return res.json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Serial number already exists in your agency",
      });
    }

    // Handle custom errors from utility function
    if (error.message) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update item error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMyItems = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 10, status, itemTypeId } = req.query;

    if (currentUser?.role !== UserRole.EMPLOYEE) {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only for employees",
      });
    }

    const filter: any = {
      currentHolder: new mongoose.Types.ObjectId(currentUser.id),
    };

    if (status) filter.status = status;
    if (itemTypeId) filter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);

    const skip = (Number(page) - 1) * Number(limit);

    // Single aggregation for both data and count
    const results = await Item.aggregate([
      { $match: filter },
      {
        $facet: {
          data: [
            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: "itemtypes",
                localField: "itemType",
                foreignField: "_id",
                as: "itemType",
                pipeline: [{ $project: { name: 1, grouping: 1, description: 1 } }]
              }
            },
            {
              $lookup: {
                from: "agencies",
                localField: "agency",
                foreignField: "_id",
                as: "agency",
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { username: 1 } }]
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "currentHolder",
                foreignField: "_id",
                as: "currentHolder",
                pipeline: [{ $project: { username: 1 } }]
              }
            },
            {
              $addFields: {
                itemType: { $arrayElemAt: ["$itemType", 0] },
                agency: { $arrayElemAt: ["$agency", 0] },
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
                currentHolder: { $arrayElemAt: ["$currentHolder", 0] }
              }
            }
          ],
          count: [{ $count: "total" }]
        }
      }
    ]);

    const items = results[0].data;
    const total = results[0].count[0]?.total || 0;

    // Get comprehensive summary including employee items AND agency inventory
    // This helps employees see both their items and available inventory per item type
    const agencySummaryFilter: any = {
      agency: new mongoose.Types.ObjectId(currentUser.agencyId),
    };
    
    // Include status and itemType filters for summary
    if (status) agencySummaryFilter.status = status;
    if (itemTypeId) agencySummaryFilter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);

    const summary = await Item.aggregate([
      { $match: agencySummaryFilter },
      {
        $group: {
          _id: { itemType: "$itemType", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "itemtypes",
          localField: "_id.itemType",
          foreignField: "_id",
          as: "itemType",
        },
      },
      {
        $group: {
          _id: "$_id.itemType",
          itemTypeName: { $first: { $arrayElemAt: ["$itemType.name", 0] } },
          statusCounts: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
    ]);

    return res.json({
      success: true,
      message: "Items currently held by you",
      data: items,
      summary,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get my items error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const bulkDeleteItems = async (req: Request, res: Response) => {
  try {
    const {
      itemTypeId,
      quantity,
      groupQuantity,
      groupName,
      status: currentStatus,
      confirmDelete,
    } = req.body;
    const currentUser = req.user;

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        message: "Bulk delete requires explicit confirmation",
      });
    }

    if (!itemTypeId) {
      return res.status(400).json({
        success: false,
        message: "Item type ID is required",
      });
    }

    // Validate item type exists and belongs to agency
    const itemType = await ItemType.findById(itemTypeId);
    if (!itemType || itemType.agency.toString() !== currentUser?.agencyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid item type or not from your agency",
      });
    }

    // Calculate number of items to delete
    let itemsToDelete = quantity || 1;
    if (groupQuantity && groupName) {
      const grouping = itemType.getGroupingByName(groupName);
      if (!grouping) {
        return res.status(400).json({
          success: false,
          message: `Grouping "${groupName}" not found in item type`,
        });
      }
      itemsToDelete = groupQuantity * grouping.unitsPerGroup;
    }

    // Build filter for items to delete
    const filter: any = {
      itemType: itemTypeId,
      agency: currentUser?.agencyId,
    };

    // Filter by current status if provided
    if (currentStatus) {
      filter.status = currentStatus;
    }

    // Employee access control
    if (currentUser?.role === UserRole.EMPLOYEE) {
      filter.currentHolder = currentUser.id;
    }

    // Find items to delete
    const itemsFound = await Item.find(filter).limit(itemsToDelete);

    if (itemsFound.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No items found matching criteria",
      });
    }

    if (itemsFound.length < itemsToDelete) {
      return res.status(400).json({
        success: false,
        message: `Only ${itemsFound.length} items available, requested ${itemsToDelete}`,
      });
    }

    // Business rule: Prevent deletion of sold items
    const soldItems = itemsFound.filter(item => item.status === ItemStatus.SOLD);
    if (soldItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${soldItems.length} sold items. Sold items should be archived instead.`,
      });
    }

    // Perform bulk delete on specific items found
    const itemIds = itemsFound.map(item => item._id);
    const deleteResult = await Item.deleteMany({ _id: { $in: itemIds } });

    return res.json({
      success: true,
      message: `${deleteResult.deletedCount} items deleted successfully`,
      data: {
        itemsDeleted: deleteResult.deletedCount,
        totalItemsRequested: itemsToDelete,
      },
    });
  } catch (error) {
    console.error("Bulk delete items error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

