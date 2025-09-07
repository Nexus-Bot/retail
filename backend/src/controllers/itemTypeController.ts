import { Request, Response } from 'express';
import ItemType from '../models/ItemType';
import { UserRole } from '../types/auth';

export const createItemType = async (req: Request, res: Response) => {
  try {
    const { name, description, grouping } = req.body;
    const currentUser = req.user;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    // Only owners can create item types
    if (currentUser?.role !== UserRole.OWNER) {
      return res.status(403).json({
        success: false,
        message: 'Only agency owners can create item types',
      });
    }

    // Validate grouping if provided (grouping is completely optional)
    if (grouping && Array.isArray(grouping) && grouping.length > 0) {
      for (const group of grouping) {
        if (!group.groupName || !group.unitsPerGroup) {
          return res.status(400).json({
            success: false,
            message: 'Each grouping requires groupName and unitsPerGroup',
          });
        }

        if (group.unitsPerGroup < 1) {
          return res.status(400).json({
            success: false,
            message: 'Units per group must be at least 1',
          });
        }
      }
    }

    const itemType = new ItemType({
      name,
      description,
      grouping: (grouping && grouping.length > 0) ? grouping : undefined,
      agency: currentUser.agencyId,
      createdBy: currentUser.id,
    });

    await itemType.save();
    await itemType.populate('agency', 'name');
    await itemType.populate('createdBy', 'username');

    return res.status(201).json({
      success: true,
      message: 'Item type created successfully',
      data: itemType,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Item type with this name already exists in your agency',
      });
    }

    console.error('Create item type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getItemTypes = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 10, search, isActive = true } = req.query;

    const filter: any = { isActive };

    // Role-based filtering
    if (currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.EMPLOYEE) {
      filter.agency = currentUser.agencyId;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const itemTypes = await ItemType.find(filter)
      .populate('agency', 'name')
      .populate('createdBy', 'username')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await ItemType.countDocuments(filter);

    return res.json({
      success: true,
      data: itemTypes,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error('Get item types error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getItemType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const itemType = await ItemType.findById(id)
      .populate('agency', 'name')
      .populate('createdBy', 'username');

    if (!itemType) {
      return res.status(404).json({
        success: false,
        message: 'Item type not found',
      });
    }

    // Role-based access control
    if (
      currentUser?.role !== UserRole.MASTER &&
      itemType.agency.toString() !== currentUser?.agencyId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    return res.json({
      success: true,
      data: itemType,
    });
  } catch (error) {
    console.error('Get item type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateItemType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, grouping, isActive } = req.body;
    const currentUser = req.user;

    const itemType = await ItemType.findById(id);
    if (!itemType) {
      return res.status(404).json({
        success: false,
        message: 'Item type not found',
      });
    }

    // Only owners can update item types in their agency
    if (
      currentUser?.role !== UserRole.OWNER ||
      itemType.agency.toString() !== currentUser?.agencyId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only agency owners can update item types',
      });
    }

    // Validate grouping if provided and not empty
    if (grouping && Array.isArray(grouping) && grouping.length > 0) {
      for (const group of grouping) {
        if (!group.groupName || !group.unitsPerGroup) {
          return res.status(400).json({
            success: false,
            message: 'Each grouping requires groupName and unitsPerGroup',
          });
        }

        if (group.unitsPerGroup < 1) {
          return res.status(400).json({
            success: false,
            message: 'Units per group must be at least 1',
          });
        }
      }
    }

    // Update fields
    if (name) itemType.name = name;
    if (description !== undefined) itemType.description = description;
    if (grouping !== undefined) {
      itemType.grouping = (grouping && grouping.length > 0) ? grouping : undefined;
    }
    if (isActive !== undefined) itemType.isActive = isActive;

    await itemType.save();
    await itemType.populate('agency', 'name');
    await itemType.populate('createdBy', 'username');

    return res.json({
      success: true,
      message: 'Item type updated successfully',
      data: itemType,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Item type with this name already exists in your agency',
      });
    }

    console.error('Update item type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};