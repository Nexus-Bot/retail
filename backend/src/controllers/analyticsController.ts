import { Request, Response } from "express";
import mongoose from "mongoose";
import Item, { ItemStatus } from "../models/Item";
import { UserRole } from "../types/auth";

// Helper function to build date range filter
const buildDateRangeFilter = (startDate?: string, endDate?: string, dateField = 'saleDate') => {
  const dateFilter: any = {};
  
  if (startDate || endDate) {
    dateFilter[dateField] = {};
    
    if (startDate) {
      dateFilter[dateField].$gte = new Date(startDate);
    }
    
    if (endDate) {
      // Add 23:59:59 to endDate to include the entire day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter[dateField].$lte = end;
    }
  }
  
  return dateFilter;
};

// Sales Analytics - Revenue, quantity, profit analysis
export const getSalesAnalytics = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { 
      startDate, 
      endDate, 
      employeeId, 
      customerId, 
      itemTypeId,
      groupBy = 'day' // day, week, month, year
    } = req.query;

    // Base filter for sold items
    const baseFilter: any = {
      status: ItemStatus.SOLD,
      saleDate: { $exists: true },
      agency: new mongoose.Types.ObjectId(currentUser?.agencyId),
      ...buildDateRangeFilter(startDate as string, endDate as string, 'saleDate')
    };

    // Additional filters
    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId as string)) {
      baseFilter.currentHolder = new mongoose.Types.ObjectId(employeeId as string);
    }
    
    if (customerId && mongoose.Types.ObjectId.isValid(customerId as string)) {
      baseFilter.saleTo = new mongoose.Types.ObjectId(customerId as string);
    }
    
    if (itemTypeId && mongoose.Types.ObjectId.isValid(itemTypeId as string)) {
      baseFilter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);
    }

    // Group by date format based on groupBy parameter
    const dateGroupFormat = {
      day: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
      week: { $dateToString: { format: "%Y-W%U", date: "$saleDate" } },
      month: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
      year: { $dateToString: { format: "%Y", date: "$saleDate" } }
    };

    const results = await Item.aggregate([
      { $match: baseFilter },
      {
        $facet: {
          // Overall summary
          summary: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$sellPrice" },
                totalQuantity: { $sum: 1 },
                averagePrice: { $avg: "$sellPrice" },
                uniqueCustomers: { $addToSet: "$saleTo" }
              }
            },
            {
              $addFields: {
                uniqueCustomersCount: { $size: "$uniqueCustomers" }
              }
            },
            {
              $project: {
                uniqueCustomers: 0
              }
            }
          ],
          
          // Time-based breakdown
          timeline: [
            {
              $group: {
                _id: dateGroupFormat[groupBy as keyof typeof dateGroupFormat],
                revenue: { $sum: "$sellPrice" },
                quantity: { $sum: 1 },
                averagePrice: { $avg: "$sellPrice" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Top performing employees
          topEmployees: [
            {
              $group: {
                _id: "$currentHolder",
                revenue: { $sum: "$sellPrice" },
                quantity: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "employee",
                pipeline: [{ $project: { username: 1 } }]
              }
            },
            {
              $unwind: "$employee"
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
          ],
          
          // Top customers
          topCustomers: [
            {
              $group: {
                _id: "$saleTo",
                revenue: { $sum: "$sellPrice" },
                quantity: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: "customers",
                localField: "_id",
                foreignField: "_id",
                as: "customer",
                pipeline: [{ $project: { name: 1, mobile: 1 } }]
              }
            },
            {
              $unwind: "$customer"
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
          ],
          
          // Item type performance
          itemTypePerformance: [
            {
              $group: {
                _id: "$itemType",
                revenue: { $sum: "$sellPrice" },
                quantity: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: "itemtypes",
                localField: "_id",
                foreignField: "_id",
                as: "itemType",
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            {
              $unwind: "$itemType"
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const analytics = results[0];

    return res.json({
      success: true,
      data: {
        summary: analytics.summary[0] || {
          totalRevenue: 0,
          totalQuantity: 0,
          averagePrice: 0,
          uniqueCustomersCount: 0
        },
        timeline: analytics.timeline,
        topEmployees: analytics.topEmployees,
        topCustomers: analytics.topCustomers,
        itemTypePerformance: analytics.itemTypePerformance,
        filters: {
          startDate,
          endDate,
          employeeId,
          customerId,
          itemTypeId,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Returns Analytics - Return patterns, reasons, quantities
export const getReturnsAnalytics = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { 
      startDate, 
      endDate, 
      employeeId, 
      customerId, 
      itemTypeId,
      groupBy = 'day'
    } = req.query;

    // Base filter for returned items
    const baseFilter: any = {
      returnDate: { $exists: true, $ne: null },
      agency: new mongoose.Types.ObjectId(currentUser?.agencyId),
      ...buildDateRangeFilter(startDate as string, endDate as string, 'returnDate')
    };

    // Additional filters
    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId as string)) {
      baseFilter.currentHolder = new mongoose.Types.ObjectId(employeeId as string);
    }
    
    if (customerId && mongoose.Types.ObjectId.isValid(customerId as string)) {
      baseFilter.saleTo = new mongoose.Types.ObjectId(customerId as string);
    }
    
    if (itemTypeId && mongoose.Types.ObjectId.isValid(itemTypeId as string)) {
      baseFilter.itemType = new mongoose.Types.ObjectId(itemTypeId as string);
    }

    const dateGroupFormat = {
      day: { $dateToString: { format: "%Y-%m-%d", date: "$returnDate" } },
      week: { $dateToString: { format: "%Y-W%U", date: "$returnDate" } },
      month: { $dateToString: { format: "%Y-%m", date: "$returnDate" } },
      year: { $dateToString: { format: "%Y", date: "$returnDate" } }
    };

    const results = await Item.aggregate([
      { $match: baseFilter },
      {
        $facet: {
          // Overall summary
          summary: [
            {
              $group: {
                _id: null,
                totalReturns: { $sum: 1 },
                totalReturnValue: { $sum: "$sellPrice" },
                averageReturnValue: { $avg: "$sellPrice" },
                uniqueCustomers: { $addToSet: "$saleTo" }
              }
            },
            {
              $addFields: {
                uniqueCustomersCount: { $size: "$uniqueCustomers" }
              }
            }
          ],
          
          // Time-based breakdown
          timeline: [
            {
              $group: {
                _id: dateGroupFormat[groupBy as keyof typeof dateGroupFormat],
                quantity: { $sum: 1 },
                value: { $sum: "$sellPrice" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Returns by employee
          employeeReturns: [
            {
              $group: {
                _id: "$currentHolder",
                quantity: { $sum: 1 },
                value: { $sum: "$sellPrice" }
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "employee",
                pipeline: [{ $project: { username: 1 } }]
              }
            },
            {
              $unwind: "$employee"
            },
            { $sort: { quantity: -1 } }
          ],
          
          // Returns by customer
          customerReturns: [
            {
              $group: {
                _id: "$saleTo",
                quantity: { $sum: 1 },
                value: { $sum: "$sellPrice" }
              }
            },
            {
              $lookup: {
                from: "customers",
                localField: "_id",
                foreignField: "_id",
                as: "customer",
                pipeline: [{ $project: { name: 1, mobile: 1 } }]
              }
            },
            {
              $unwind: "$customer"
            },
            { $sort: { quantity: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const analytics = results[0];

    return res.json({
      success: true,
      data: {
        summary: analytics.summary[0] || {
          totalReturns: 0,
          totalReturnValue: 0,
          averageReturnValue: 0,
          uniqueCustomersCount: 0
        },
        timeline: analytics.timeline,
        employeeReturns: analytics.employeeReturns,
        customerReturns: analytics.customerReturns,
        filters: {
          startDate,
          endDate,
          employeeId,
          customerId,
          itemTypeId,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Returns analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Employee Performance Analytics
export const getEmployeeAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    // Role-based access control
    if (currentUser?.role === UserRole.EMPLOYEE && currentUser.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - can only view your own analytics'
      });
    }

    const employeeFilter = new mongoose.Types.ObjectId(id);
    const agencyFilter = new mongoose.Types.ObjectId(currentUser?.agencyId);

    const dateGroupFormat = {
      day: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
      week: { $dateToString: { format: "%Y-W%U", date: "$saleDate" } },
      month: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
      year: { $dateToString: { format: "%Y", date: "$saleDate" } }
    };

    const results = await Item.aggregate([
      {
        $match: {
          currentHolder: employeeFilter,
          agency: agencyFilter
        }
      },
      {
        $facet: {
          // Sales performance
          sales: [
            {
              $match: {
                status: ItemStatus.SOLD,
                saleDate: { $exists: true },
                ...buildDateRangeFilter(startDate as string, endDate as string, 'saleDate')
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$sellPrice" },
                totalSales: { $sum: 1 },
                averagePrice: { $avg: "$sellPrice" }
              }
            }
          ],
          
          // Sales timeline
          salesTimeline: [
            {
              $match: {
                status: ItemStatus.SOLD,
                saleDate: { $exists: true },
                ...buildDateRangeFilter(startDate as string, endDate as string, 'saleDate')
              }
            },
            {
              $group: {
                _id: dateGroupFormat[groupBy as keyof typeof dateGroupFormat],
                revenue: { $sum: "$sellPrice" },
                quantity: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Returns processed
          returns: [
            {
              $match: {
                returnDate: { $exists: true, $ne: null },
                ...buildDateRangeFilter(startDate as string, endDate as string, 'returnDate')
              }
            },
            {
              $group: {
                _id: null,
                totalReturns: { $sum: 1 },
                totalReturnValue: { $sum: "$sellPrice" }
              }
            }
          ],
          
          // Current inventory
          currentInventory: [
            {
              $match: {
                status: ItemStatus.WITH_EMPLOYEE
              }
            },
            {
              $group: {
                _id: "$itemType",
                quantity: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: "itemtypes",
                localField: "_id",
                foreignField: "_id",
                as: "itemType",
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            {
              $unwind: "$itemType"
            }
          ]
        }
      }
    ]);

    const analytics = results[0];

    return res.json({
      success: true,
      data: {
        employeeId: id,
        sales: analytics.sales[0] || { totalRevenue: 0, totalSales: 0, averagePrice: 0 },
        salesTimeline: analytics.salesTimeline,
        returns: analytics.returns[0] || { totalReturns: 0, totalReturnValue: 0 },
        currentInventory: analytics.currentInventory,
        filters: { startDate, endDate, groupBy }
      }
    });
  } catch (error) {
    console.error('Employee analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Customer Analytics - Purchase history, return patterns
export const getCustomerAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const customerFilter = new mongoose.Types.ObjectId(id);
    const agencyFilter = new mongoose.Types.ObjectId(currentUser?.agencyId);

    const dateGroupFormat = {
      day: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
      week: { $dateToString: { format: "%Y-W%U", date: "$saleDate" } },
      month: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
      year: { $dateToString: { format: "%Y", date: "$saleDate" } }
    };

    const results = await Item.aggregate([
      {
        $match: {
          saleTo: customerFilter,
          agency: agencyFilter,
          status: ItemStatus.SOLD,
          saleDate: { $exists: true }
        }
      },
      {
        $facet: {
          // Purchase summary
          summary: [
            {
              $match: buildDateRangeFilter(startDate as string, endDate as string, 'saleDate')
            },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: "$sellPrice" },
                totalPurchases: { $sum: 1 },
                averageOrderValue: { $avg: "$sellPrice" }
              }
            }
          ],
          
          // Purchase timeline
          timeline: [
            {
              $match: buildDateRangeFilter(startDate as string, endDate as string, 'saleDate')
            },
            {
              $group: {
                _id: dateGroupFormat[groupBy as keyof typeof dateGroupFormat],
                spent: { $sum: "$sellPrice" },
                quantity: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Favorite products
          favoriteProducts: [
            {
              $group: {
                _id: "$itemType",
                quantity: { $sum: 1 },
                totalSpent: { $sum: "$sellPrice" }
              }
            },
            {
              $lookup: {
                from: "itemtypes",
                localField: "_id",
                foreignField: "_id",
                as: "itemType",
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            {
              $unwind: "$itemType"
            },
            { $sort: { quantity: -1 } }
          ],
          
          // Returns by this customer
          returns: [
            {
              $match: {
                returnDate: { $exists: true, $ne: null },
                ...buildDateRangeFilter(startDate as string, endDate as string, 'returnDate')
              }
            },
            {
              $group: {
                _id: null,
                totalReturns: { $sum: 1 },
                totalReturnValue: { $sum: "$sellPrice" }
              }
            }
          ]
        }
      }
    ]);

    const analytics = results[0];

    return res.json({
      success: true,
      data: {
        customerId: id,
        summary: analytics.summary[0] || { totalSpent: 0, totalPurchases: 0, averageOrderValue: 0 },
        timeline: analytics.timeline,
        favoriteProducts: analytics.favoriteProducts,
        returns: analytics.returns[0] || { totalReturns: 0, totalReturnValue: 0 },
        filters: { startDate, endDate, groupBy }
      }
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Dashboard Analytics - High-level overview for agency
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { startDate, endDate } = req.query;

    const agencyFilter = new mongoose.Types.ObjectId(currentUser?.agencyId);
    const dateFilter = buildDateRangeFilter(startDate as string, endDate as string, 'saleDate');

    const results = await Item.aggregate([
      {
        $match: {
          agency: agencyFilter
        }
      },
      {
        $facet: {
          // Sales overview
          salesOverview: [
            {
              $match: {
                status: ItemStatus.SOLD,
                saleDate: { $exists: true },
                ...dateFilter
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$sellPrice" },
                totalSales: { $sum: 1 },
                averageOrderValue: { $avg: "$sellPrice" }
              }
            }
          ],
          
          // Inventory status
          inventoryStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          
          // Recent activity (last 7 days)
          recentActivity: [
            {
              $match: {
                $or: [
                  { 
                    saleDate: { 
                      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                    }
                  },
                  { 
                    returnDate: { 
                      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                    }
                  }
                ]
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: { 
                    format: "%Y-%m-%d", 
                    date: { 
                      $cond: [
                        { $ifNull: ["$saleDate", false] },
                        "$saleDate",
                        "$returnDate"
                      ]
                    }
                  }
                },
                sales: {
                  $sum: {
                    $cond: [{ $ifNull: ["$saleDate", false] }, 1, 0]
                  }
                },
                returns: {
                  $sum: {
                    $cond: [{ $ifNull: ["$returnDate", false] }, 1, 0]
                  }
                },
                revenue: {
                  $sum: {
                    $cond: [{ $ifNull: ["$saleDate", false] }, "$sellPrice", 0]
                  }
                }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Top performers (employees)
          topPerformers: [
            {
              $match: {
                status: ItemStatus.SOLD,
                saleDate: { $exists: true },
                ...dateFilter
              }
            },
            {
              $group: {
                _id: "$currentHolder",
                revenue: { $sum: "$sellPrice" },
                sales: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "employee",
                pipeline: [{ $project: { username: 1 } }]
              }
            },
            {
              $unwind: "$employee"
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    const analytics = results[0];

    return res.json({
      success: true,
      data: {
        salesOverview: analytics.salesOverview[0] || { totalRevenue: 0, totalSales: 0, averageOrderValue: 0 },
        inventoryStatus: analytics.inventoryStatus,
        recentActivity: analytics.recentActivity,
        topPerformers: analytics.topPerformers,
        filters: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};