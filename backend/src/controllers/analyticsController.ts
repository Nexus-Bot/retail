import { Request, Response } from "express";
import mongoose from "mongoose";
import Item, { ItemStatus } from "../models/Item";

// Helper function to build date range filter
const buildDateRangeFilter = (startDate?: string, endDate?: string) => {
  const dateFilter: any = {};
  
  if (startDate || endDate) {
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    
    if (endDate) {
      // Add 23:59:59 to endDate to include the entire day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
  }
  
  return dateFilter;
};

// Main Analytics - Item Type Table with Sales and Returns
export const getItemTypeAnalytics = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { startDate, endDate, employeeId } = req.query;

    const agencyFilter = new mongoose.Types.ObjectId(currentUser?.agencyId);
    
    // Build employee filter if provided
    const employeeFilter = employeeId && mongoose.Types.ObjectId.isValid(employeeId as string) 
      ? new mongoose.Types.ObjectId(employeeId as string) 
      : null;
    
    // Build date filters for sales and returns
    const salesDateFilter = buildDateRangeFilter(startDate as string, endDate as string);
    const returnsDateFilter = buildDateRangeFilter(startDate as string, endDate as string);

    const results = await Item.aggregate([
      {
        $match: {
          agency: agencyFilter,
          ...(employeeFilter && { currentHolder: employeeFilter }),
          // Match items that were either sold or returned in the date range
          $or: [
            {
              status: ItemStatus.SOLD,
              saleDate: { $exists: true, ...salesDateFilter }
            },
            {
              returnDate: { $exists: true, $ne: null, ...returnsDateFilter }
            }
          ]
        }
      },
      {
        $group: {
          _id: "$itemType",
          // Count sales (items sold in date range)
          salesCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", ItemStatus.SOLD] },
                    { $ifNull: ["$saleDate", false] },
                    ...(Object.keys(salesDateFilter).length > 0 ? [
                      { $gte: ["$saleDate", salesDateFilter.$gte || new Date(0)] },
                      { $lte: ["$saleDate", salesDateFilter.$lte || new Date()] }
                    ] : [])
                  ]
                },
                1,
                0
              ]
            }
          },
          // Calculate total sales revenue
          salesRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", ItemStatus.SOLD] },
                    { $ifNull: ["$saleDate", false] },
                    { $ifNull: ["$sellPrice", false] },
                    ...(Object.keys(salesDateFilter).length > 0 ? [
                      { $gte: ["$saleDate", salesDateFilter.$gte || new Date(0)] },
                      { $lte: ["$saleDate", salesDateFilter.$lte || new Date()] }
                    ] : [])
                  ]
                },
                "$sellPrice",
                0
              ]
            }
          },
          // Count returns (items returned in date range)
          returnsCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$returnDate", null] },
                    { $ifNull: ["$returnDate", false] },
                    ...(Object.keys(returnsDateFilter).length > 0 ? [
                      { $gte: ["$returnDate", returnsDateFilter.$gte || new Date(0)] },
                      { $lte: ["$returnDate", returnsDateFilter.$lte || new Date()] }
                    ] : [])
                  ]
                },
                1,
                0
              ]
            }
          },
          // Calculate total returns revenue (lost revenue)
          returnsRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$returnDate", null] },
                    { $ifNull: ["$returnDate", false] },
                    { $ifNull: ["$sellPrice", false] },
                    ...(Object.keys(returnsDateFilter).length > 0 ? [
                      { $gte: ["$returnDate", returnsDateFilter.$gte || new Date(0)] },
                      { $lte: ["$returnDate", returnsDateFilter.$lte || new Date()] }
                    ] : [])
                  ]
                },
                "$sellPrice",
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "itemtypes",
          localField: "_id",
          foreignField: "_id",
          as: "itemType",
          pipeline: [{ $project: { name: 1, grouping: 1 } }]
        }
      },
      {
        $unwind: "$itemType"
      },
      {
        $project: {
          _id: 1,
          itemTypeName: "$itemType.name",
          grouping: "$itemType.grouping",
          salesCount: 1,
          salesRevenue: 1,
          returnsCount: 1,
          returnsRevenue: 1
        }
      },
      {
        $sort: { itemTypeName: 1 }
      }
    ]);

    // Calculate totals
    const totals = results.reduce(
      (acc, item) => ({
        totalSales: acc.totalSales + item.salesCount,
        totalSalesRevenue: acc.totalSalesRevenue + (item.salesRevenue || 0),
        totalReturns: acc.totalReturns + item.returnsCount,
        totalReturnsRevenue: acc.totalReturnsRevenue + (item.returnsRevenue || 0)
      }),
      { totalSales: 0, totalSalesRevenue: 0, totalReturns: 0, totalReturnsRevenue: 0 }
    );

    return res.json({
      success: true,
      data: {
        itemTypes: results,
        totals,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          employeeId: employeeId || null
        }
      }
    });
  } catch (error) {
    console.error('Item type analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};