import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { Route } from '../models/Route';
import mongoose from 'mongoose';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, mobile, routeId } = req.body;
    const currentUser = req.user!;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer name is required' 
      });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mobile number is required' 
      });
    }

    if (!routeId || !mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid route ID is required' 
      });
    }

    // Check if route exists and belongs to user's agency
    const route = await Route.findOne({ 
      _id: routeId, 
      agency: currentUser.agencyId 
    }).lean();

    if (!route) {
      return res.status(400).json({ 
        success: false, 
        message: 'Route not found or does not belong to your agency' 
      });
    }

    // Check if mobile number already exists within the agency
    const existingCustomer = await Customer.findOne({ 
      mobile: mobile.trim(), 
      agency: currentUser.agencyId 
    }).lean();
    
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer with this mobile number already exists in your agency' 
      });
    }

    const customer = new Customer({
      name: name.trim(),
      mobile: mobile.trim(),
      route: routeId,
      agency: currentUser.agencyId,
      createdBy: currentUser.id,
    });

    await customer.save();
    await customer.populate([
      { path: 'route', select: 'name' },
      { path: 'createdBy', select: 'username' }
    ]);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const { page = 1, limit = 20, search, routeId } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const query: any = { agency: new mongoose.Types.ObjectId(currentUser.agencyId) };
    
    // Filter by route if specified
    if (routeId && mongoose.Types.ObjectId.isValid(routeId as string)) {
      query.route = new mongoose.Types.ObjectId(routeId as string);
    }
    
    // Add search functionality
    if (search) {
      query.$text = { $search: search as string };
    }
    
    // Single aggregation for both data and count (better performance)
    const results = await Customer.aggregate([
      { $match: query },
      {
        $facet: {
          data: [
            { $sort: search ? { score: { $meta: 'textScore' } } : { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: "routes",
                localField: "route",
                foreignField: "_id",
                as: "route",
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
              $unwind: {
                path: "$route",
                preserveNullAndEmptyArrays: true
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

    const customers = results[0].data;
    const totalItems = results[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / Number(limit));

    return res.json({
      success: true,
      data: customers,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems,
        itemsPerPage: Number(limit),
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid customer ID' 
      });
    }

    const customer = await Customer.findOne({ 
      _id: id, 
      agency: currentUser.agencyId 
    }).populate([
      { path: 'route', select: 'name' },
      { path: 'createdBy', select: 'username' }
    ]).lean();

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, mobile, routeId } = req.body;
    const currentUser = req.user!;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid customer ID' 
      });
    }

    // Validation for provided fields only
    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer name cannot be empty' 
      });
    }

    if (mobile !== undefined && (!mobile || !mobile.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mobile number cannot be empty' 
      });
    }

    if (routeId !== undefined && (!routeId || !mongoose.Types.ObjectId.isValid(routeId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid route ID is required' 
      });
    }

    // Check if customer exists and belongs to user's agency
    const customer = await Customer.findOne({ 
      _id: id, 
      agency: currentUser.agencyId 
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Check if route exists and belongs to user's agency (only if routeId is provided)
    if (routeId !== undefined) {
      const route = await Route.findOne({ 
        _id: routeId, 
        agency: currentUser.agencyId 
      }).lean();

      if (!route) {
        return res.status(400).json({ 
          success: false, 
          message: 'Route not found or does not belong to your agency' 
        });
      }
    }

    // Check if new mobile number conflicts with existing customers (only if mobile is provided)
    if (mobile !== undefined) {
      const existingCustomer = await Customer.findOne({ 
        mobile: mobile.trim(), 
        agency: currentUser.agencyId,
        _id: { $ne: id }
      }).lean();

      if (existingCustomer) {
        return res.status(400).json({ 
          success: false, 
          message: 'Customer with this mobile number already exists in your agency' 
        });
      }
    }

    // Update only provided fields
    if (name !== undefined) {
      customer.name = name.trim();
    }
    if (mobile !== undefined) {
      customer.mobile = mobile.trim();
    }
    if (routeId !== undefined) {
      customer.route = routeId;
    }
    
    await customer.save();
    await customer.populate([
      { path: 'route', select: 'name' },
      { path: 'createdBy', select: 'username' }
    ]);

    return res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid customer ID' 
      });
    }

    const customer = await Customer.findOne({ 
      _id: id, 
      agency: currentUser.agencyId 
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    await Customer.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};