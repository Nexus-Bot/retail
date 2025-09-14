import { Request, Response } from 'express';
import Agency from '../models/Agency';

export const createAgency = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agency name is required' 
      });
    }

    const existingAgency = await Agency.findOne({ name }).lean();
    if (existingAgency) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agency with this name already exists' 
      });
    }

    const agency = new Agency({
      name,
      createdBy: req.user!.id,
    });

    await agency.save();

    return res.status(201).json({
      success: true,
      message: 'Agency created successfully',
      data: agency
    });
  } catch (error) {
    console.error('Create agency error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getAgencies = async (req: Request, res: Response) => {
  try {
    const agencies = await Agency.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: agencies
    });
  } catch (error) {
    console.error('Get agencies error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agency = await Agency.findById(id)
      .populate('createdBy', 'username')
      .lean();

    if (!agency) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agency not found' 
      });
    }

    return res.json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Get agency error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const updateAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agency not found' 
      });
    }

    if (name) agency.name = name;
    if (status) agency.status = status;

    await agency.save();

    return res.json({
      success: true,
      message: 'Agency updated successfully',
      data: agency
    });
  } catch (error) {
    console.error('Update agency error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};