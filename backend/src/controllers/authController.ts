import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User";
import Agency from "../models/Agency";
import { UserRole } from "../types/auth";
import { cacheService } from "../config/cache";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username }).populate(
      "agency",
      "name status"
    );

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== "active") {
      return res.status(401).json({ message: "Account is not active" });
    }

    // Check if agency is active (for non-master users)
    if (
      user.role !== UserRole.MASTER &&
      (!user.agency || (user.agency as any).status !== "active")
    ) {
      return res.status(401).json({ message: "Agency is not active" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    // Generate unique token ID for session tracking
    const tokenId = crypto.randomUUID();

    const token = jwt.sign(
      {
        id: user._id,
        tokenId,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRE || "30d",
      } as SignOptions
    );

    // Add session to user's active sessions
    const userAgent = req.get("User-Agent");
    const ipAddress = req.ip || req.socket?.remoteAddress;

    user.addSession(tokenId, userAgent, ipAddress);
    user.lastLogin = new Date();
    await user.save();

    const userResponse = {
      id: user._id,
      username: user.username,
      role: user.role,
      agency: user.agency,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
    };

    return res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id)
      .populate("agency", "name email phone address status")
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, role, agencyId, permissions } = req.body;
    const currentUser = req.user;

    // Validation
    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ message: "Username, password, and role are required" });
    }

    // Role-based creation restrictions
    if (currentUser?.role === UserRole.OWNER && role !== UserRole.EMPLOYEE) {
      return res.status(403).json({
        message: "Owners can only create employees within their agency",
      });
    }

    // Agency assignment
    let assignedAgencyId = agencyId;
    if (role !== UserRole.MASTER) {
      if (currentUser?.role === UserRole.MASTER) {
        if (!agencyId) {
          return res
            .status(400)
            .json({ message: "Agency is required for non-master users" });
        }
        const agency = await Agency.findById(agencyId);
        if (!agency) {
          return res.status(404).json({ message: "Agency not found" });
        }
      } else {
        // Non-master users can only create users in their own agency
        assignedAgencyId = currentUser?.agencyId;
      }
    }

    const user = new User({
      username,
      password,
      role,
      agency: assignedAgencyId,
      permissions: permissions || undefined, // Will use defaults if not provided
      createdBy: currentUser?.id,
    });

    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate("agency", "name")
      .select("-password");

    return res.status(201).json({
      message: "User created successfully",
      user: populatedUser,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 10, search, role, status } = req.query;

    const filter: any = {};

    // Role-based filtering
    if (currentUser?.role === UserRole.OWNER) {
      filter.agency = new mongoose.Types.ObjectId(currentUser.agencyId);
    }

    if (search) {
      filter.username = { $regex: search, $options: "i" };
    }

    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    // Single aggregation for both data and count
    const results = await User.aggregate([
      { $match: filter },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
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
              $addFields: {
                agency: { $arrayElemAt: ["$agency", 0] },
                createdBy: { $arrayElemAt: ["$createdBy", 0] }
              }
            },
            {
              $project: {
                password: 0, // Exclude password field
                activeSessions: 0 // Exclude sensitive session data
              }
            }
          ],
          count: [{ $count: "total" }]
        }
      }
    ]);

    const users = results[0].data;
    const total = results[0].count[0]?.total || 0;

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, role, agencyId, permissions, status, password } = req.body;
    const currentUser = req.user;

    // Find the user to update
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    // Permission checks
    if (currentUser?.role === UserRole.OWNER) {
      // Owners can only update employees within their agency
      if (userToUpdate.agency?.toString() !== currentUser.agencyId) {
        return res.status(403).json({
          message: "You can only update users within your agency",
        });
      }
      if (userToUpdate.role !== UserRole.EMPLOYEE) {
        return res.status(403).json({
          message: "Owners can only update employees",
        });
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (username) {
      updateData.username = username;
    }

    if (role !== undefined) {
      // Role change restrictions
      if (currentUser?.role === UserRole.OWNER && role !== UserRole.EMPLOYEE) {
        return res.status(403).json({
          message: "Owners can only assign employee role",
        });
      }
      updateData.role = role;
    }

    if (agencyId !== undefined) {
      // Agency assignment restrictions
      if (currentUser?.role === UserRole.OWNER) {
        // Owners cannot change agency assignment
        if (agencyId !== currentUser.agencyId) {
          return res.status(403).json({
            message: "You cannot assign users to other agencies",
          });
        }
      } else if (currentUser?.role === UserRole.MASTER) {
        // Masters can assign to any agency
        if (agencyId) {
          const agency = await Agency.findById(agencyId);
          if (!agency) {
            return res.status(404).json({ message: "Agency not found" });
          }
        }
      }
      updateData.agency = agencyId;
    }

    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (password) {
      // Password will be hashed by the pre-save middleware
      updateData.password = password;
    }

    updateData.updatedAt = new Date();

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("agency", "name")
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Invalidate user cache on update
    const userSessions = userToUpdate.activeSessions || [];
    for (const session of userSessions) {
      const cacheKey = `user:${id}:${session.tokenId}`;
      await cacheService.del(cacheKey);
    }

    return res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    return res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;

    if (!currentUser?.tokenId) {
      return res.status(400).json({
        success: false,
        message: "No active session found",
      });
    }

    const user = await User.findById(currentUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove the current session
    user.removeSession(currentUser.tokenId);
    await user.save();

    // Invalidate cache for this session
    const cacheKey = `user:${currentUser.id}:${currentUser.tokenId}`;
    await cacheService.del(cacheKey);

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const logoutAll = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;

    if (!currentUser?.id) {
      return res.status(400).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(currentUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get sessions before removal for cache invalidation
    const sessionsToRemove = [...user.activeSessions];
    
    // Remove all sessions
    user.removeAllSessions();
    await user.save();

    // Invalidate all cached sessions
    for (const session of sessionsToRemove) {
      const cacheKey = `user:${currentUser.id}:${session.tokenId}`;
      await cacheService.del(cacheKey);
    }

    return res.json({
      success: true,
      message: "Logged out from all sessions successfully",
      sessionsRemoved: sessionsToRemove.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};
