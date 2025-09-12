import { Request, Response } from 'express';
import { Route } from '../models/Route';
import { Customer } from '../models/Customer';
import mongoose from 'mongoose';

export const createRoute = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const currentUser = req.user!;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Route name is required' 
      });
    }

    // Check if route already exists within the agency
    const existingRoute = await Route.findOne({ 
      name: name.trim(), 
      agency: currentUser.agencyId 
    });
    
    if (existingRoute) {
      return res.status(400).json({ 
        success: false, 
        message: 'Route with this name already exists in your agency' 
      });
    }

    const route = new Route({
      name: name.trim(),
      agency: currentUser.agencyId,
      createdBy: currentUser.id,
    });

    await route.save();
    await route.populate('createdBy', 'username');

    return res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });
  } catch (error) {
    console.error('Create route error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const { page = 1, limit = 20, search } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const query: any = { agency: new mongoose.Types.ObjectId(currentUser.agencyId) };
    
    // Add search functionality
    if (search) {
      query.$text = { $search: search as string };
    }
    
    // Single aggregation for both data and count (better performance)
    const results = await Route.aggregate([
      { $match: query },
      {
        $facet: {
          data: [
            { $sort: search ? { score: { $meta: 'textScore' } } : { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
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
              $unwind: {
                path: "$createdBy",
                preserveNullAndEmptyArrays: true
              }
            }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ]);

    const routes = results[0].data;
    const totalItems = results[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / Number(limit));

    return res.json({
      success: true,
      data: routes,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems,
        itemsPerPage: Number(limit),
      }
    });
  } catch (error) {
    console.error('Get routes error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid route ID' 
      });
    }

    const route = await Route.findOne({ 
      _id: id, 
      agency: currentUser.agencyId 
    }).populate('createdBy', 'username');

    if (!route) {
      return res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
      });
    }

    return res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Get route error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const currentUser = req.user!;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid route ID' 
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Route name is required' 
      });
    }

    // Check if route exists and belongs to user's agency
    const route = await Route.findOne({ 
      _id: id, 
      agency: currentUser.agencyId 
    });

    if (!route) {
      return res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
      });
    }

    // Check if new name conflicts with existing routes (excluding current route)
    const existingRoute = await Route.findOne({ 
      name: name.trim(), 
      agency: currentUser.agencyId,
      _id: { $ne: id }
    });

    if (existingRoute) {
      return res.status(400).json({ 
        success: false, 
        message: 'Route with this name already exists in your agency' 
      });
    }

    route.name = name.trim();
    await route.save();
    await route.populate('createdBy', 'username');

    return res.json({
      success: true,
      message: 'Route updated successfully',
      data: route
    });
  } catch (error) {
    console.error('Update route error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid route ID' 
      });
    }

    const route = await Route.findOne({ 
      _id: id, 
      agency: currentUser.agencyId 
    });

    if (!route) {
      return res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
      });
    }

    // Check if route has associated customers before deletion (using aggregation for better performance)
    const customerCountResult = await Customer.aggregate([
      { 
        $match: { 
          route: new mongoose.Types.ObjectId(id), 
          agency: currentUser.agencyId 
        } 
      },
      { $count: "count" }
    ]);

    const customerCount = customerCountResult[0]?.count || 0;

    if (customerCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete route. It has ${customerCount} associated customer${customerCount > 1 ? 's' : ''}. Please reassign or delete the customers first.` 
      });
    }
    
    await Route.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Delete route error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};