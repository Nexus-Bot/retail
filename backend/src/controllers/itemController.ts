import { Request, Response } from "express";
import mongoose from "mongoose";
import Item, { ItemStatus } from "../models/Item";
import ItemType from "../models/ItemType";
import User from "../models/User";
import { Customer } from "../models/Customer";
import { UserRole } from "../types/auth";

export const createItems = async (req: Request, res: Response) => {
  try {
    const { itemTypeId, quantity, groupQuantity, groupName } = req.body;
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
    if (itemTypeId)
      filter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);

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
                pipeline: [
                  { $project: { name: 1, grouping: 1, description: 1 } },
                ],
              },
            },
            {
              $lookup: {
                from: "agencies",
                localField: "agency",
                foreignField: "_id",
                as: "agency",
                pipeline: [{ $project: { name: 1 } }],
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { username: 1 } }],
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "currentHolder",
                foreignField: "_id",
                as: "currentHolder",
                pipeline: [{ $project: { username: 1 } }],
              },
            },
            {
              $lookup: {
                from: "customers",
                localField: "saleTo",
                foreignField: "_id",
                as: "saleTo",
                pipeline: [{ $project: { name: 1, mobile: 1 } }],
              },
            },
            {
              $addFields: {
                itemType: { $arrayElemAt: ["$itemType", 0] },
                agency: { $arrayElemAt: ["$agency", 0] },
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
                currentHolder: { $arrayElemAt: ["$currentHolder", 0] },
                saleTo: { $arrayElemAt: ["$saleTo", 0] },
              },
            },
          ],
          count: [{ $count: "total" }],
        },
      },
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
    if (itemTypeId)
      summaryFilter.itemType = new mongoose.Types.ObjectId(
        itemTypeId as string
      );

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
      .populate("currentHolder", "username")
      .populate("saleTo", "name mobile");

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
      sellPrice,
      saleTo,
      quantity,
      groupQuantity,
      groupName,
      currentStatus,
    } = req.body;
    const currentUser = req.user;

    // === REQUIRED FIELD VALIDATION ===
    if (!itemTypeId) {
      return res.status(400).json({
        success: false,
        message: "Item type ID is required",
      });
    }

    if (!currentStatus) {
      return res.status(400).json({
        success: false,
        message: "Current status is required to validate transitions",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Target status is required",
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
      status: currentStatus, // Required field, no conditional needed
    };

    // Employee access control - Special case for returns (sold -> with_employee)
    if (currentUser?.role === UserRole.EMPLOYEE) {
      // For returns, any employee can process sold items, bypass currentHolder restriction
      if (!(currentStatus === ItemStatus.SOLD && status === ItemStatus.WITH_EMPLOYEE)) {
        filter.currentHolder = currentUser.id;
      }
    }
    
    // For return processing, filter by specific customer (saleTo)
    // This ensures customers can only return items they originally purchased
    if (currentStatus === ItemStatus.SOLD && status === ItemStatus.WITH_EMPLOYEE && saleTo) {
      filter.saleTo = saleTo;
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


    // === BUSINESS LOGIC VALIDATION BY TRANSITION ===
    
    // 1. IN_INVENTORY -> WITH_EMPLOYEE (Assign to Employee)
    if (currentStatus === ItemStatus.IN_INVENTORY && status === ItemStatus.WITH_EMPLOYEE) {
      // Validate required fields
      if (!currentHolder) {
        return res.status(400).json({
          success: false,
          message: "Employee ID (currentHolder) is required when assigning items to employee",
        });
      }
      
      // Validate employee exists and belongs to same agency
      const employee = await User.findById(currentHolder);
      if (!employee || employee.role !== UserRole.EMPLOYEE) {
        return res.status(404).json({
          success: false,
          message: "Valid employee not found",
        });
      }
      if (employee.agency?.toString() !== currentUser?.agencyId) {
        return res.status(400).json({
          success: false,
          message: "Employee must be from your agency",
        });
      }
      
      // Block unrelated fields for this transition
      if (saleTo !== undefined || sellPrice !== undefined) {
        return res.status(400).json({
          success: false,
          message: "saleTo and sellPrice are not allowed for assignment transitions",
        });
      }
      
      // Set update data
      updateData.status = status;
      updateData.currentHolder = currentHolder;
    }
    
    // 2. WITH_EMPLOYEE -> SOLD (Sale Transaction)  
    else if (currentStatus === ItemStatus.WITH_EMPLOYEE && status === ItemStatus.SOLD) {
      // Validate required fields
      if (!saleTo) {
        return res.status(400).json({
          success: false,
          message: "Customer ID (saleTo) is required for sale transactions",
        });
      }
      if (sellPrice === undefined || sellPrice === null) {
        return res.status(400).json({
          success: false,
          message: "Sell price is required for sale transactions",
        });
      }
      
      // Validate sellPrice
      if (typeof sellPrice !== "number" || sellPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Sell price must be a positive number",
        });
      }
      
      // Validate customer exists and belongs to same agency
      const customer = await Customer.findById(saleTo);
      if (!customer || customer.agency.toString() !== currentUser?.agencyId) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer or customer not from your agency",
        });
      }
      
      // Block unrelated fields for this transition
      if (currentHolder !== undefined) {
        return res.status(400).json({
          success: false,
          message: "currentHolder is not allowed for sale transactions (currentHolder preserved during sale)",
        });
      }
      
      // Set update data with analytics
      updateData.status = status;
      updateData.sellPrice = sellPrice;
      updateData.saleTo = saleTo;
      updateData.saleDate = new Date();
      updateData.returnDate = null; // Clear return date
    }
    
    // 3. SOLD -> WITH_EMPLOYEE (Return Processing)
    else if (currentStatus === ItemStatus.SOLD && status === ItemStatus.WITH_EMPLOYEE) {
      // Validate required fields
      if (!currentHolder) {
        return res.status(400).json({
          success: false,
          message: "Employee ID (currentHolder) is required to process returns",
        });
      }
      
      if (!saleTo) {
        return res.status(400).json({
          success: false,
          message: "Customer ID (saleTo) is required to validate return eligibility",
        });
      }
      
      // Validate employee exists and belongs to same agency (any employee can process returns)
      const employee = await User.findById(currentHolder);
      if (!employee || employee.role !== UserRole.EMPLOYEE) {
        return res.status(404).json({
          success: false,
          message: "Valid employee not found",
        });
      }
      if (employee.agency?.toString() !== currentUser?.agencyId) {
        return res.status(400).json({
          success: false,
          message: "Employee must be from your agency",
        });
      }
      
      // Validate customer exists and belongs to same agency
      const customer = await Customer.findById(saleTo);
      if (!customer || customer.agency.toString() !== currentUser?.agencyId) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer or customer not from your agency",
        });
      }
      
      // Block unrelated fields for this transition
      if (sellPrice !== undefined) {
        return res.status(400).json({
          success: false,
          message: "sellPrice is not allowed for return processing",
        });
      }
      
      // Set update data with analytics
      updateData.status = status;
      updateData.currentHolder = currentHolder;
      updateData.returnDate = new Date();
    }
    
    // Block invalid transitions
    else if (currentStatus !== status) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${currentStatus} to ${status}`,
      });
    }
    
    // Block redundant updates (same status)
    else {
      return res.status(400).json({
        success: false,
        message: `Items are already in ${status} status`,
      });
    }

    updateData.updatedAt = new Date();

    // Perform bulk update - single database operation
    const itemIds = itemsFound.map((item) => item._id);
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
      .populate("saleTo", "name mobile")
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
    if (itemTypeId)
      filter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);

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
                pipeline: [
                  { $project: { name: 1, grouping: 1, description: 1 } },
                ],
              },
            },
            {
              $lookup: {
                from: "agencies",
                localField: "agency",
                foreignField: "_id",
                as: "agency",
                pipeline: [{ $project: { name: 1 } }],
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { username: 1 } }],
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "currentHolder",
                foreignField: "_id",
                as: "currentHolder",
                pipeline: [{ $project: { username: 1 } }],
              },
            },
            {
              $lookup: {
                from: "customers",
                localField: "saleTo",
                foreignField: "_id",
                as: "saleTo",
                pipeline: [{ $project: { name: 1, mobile: 1 } }],
              },
            },
            {
              $addFields: {
                itemType: { $arrayElemAt: ["$itemType", 0] },
                agency: { $arrayElemAt: ["$agency", 0] },
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
                currentHolder: { $arrayElemAt: ["$currentHolder", 0] },
                saleTo: { $arrayElemAt: ["$saleTo", 0] },
              },
            },
          ],
          count: [{ $count: "total" }],
        },
      },
    ]);

    const items = results[0].data;
    const total = results[0].count[0]?.total || 0;

    // Get employee-specific summary that respects currentHolder for WITH_EMPLOYEE and SOLD items
    // Only show items the employee has access to based on currentHolder
    const summary = await Item.aggregate([
      {
        $match: {
          agency: new mongoose.Types.ObjectId(currentUser.agencyId),
          ...(status && { status }),
          ...(itemTypeId && { itemType: new mongoose.Types.ObjectId(itemTypeId as string) }),
        }
      },
      {
        $addFields: {
          // Apply currentHolder filter only for WITH_EMPLOYEE and SOLD statuses
          isEmployeeAccessible: {
            $cond: {
              if: { 
                $in: ["$status", [ItemStatus.WITH_EMPLOYEE, ItemStatus.SOLD]] 
              },
              then: { 
                $eq: ["$currentHolder", new mongoose.Types.ObjectId(currentUser.id)] 
              },
              else: true // IN_INVENTORY items are visible to all employees in the agency
            }
          }
        }
      },
      {
        $match: {
          isEmployeeAccessible: true
        }
      },
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
    const soldItems = itemsFound.filter(
      (item) => item.status === ItemStatus.SOLD
    );
    if (soldItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${soldItems.length} sold items. Sold items should be archived instead.`,
      });
    }

    // Perform bulk delete on specific items found
    const itemIds = itemsFound.map((item) => item._id);
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
