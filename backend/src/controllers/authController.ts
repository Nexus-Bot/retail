import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import Agency from "../models/Agency";
import { UserRole } from "../types/auth";

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
      .select("-password");

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
      filter.agency = currentUser.agencyId;
    }

    if (search) {
      filter.username = { $regex: search, $options: "i" };
    }

    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(filter)
      .populate("agency", "name")
      .populate("createdBy", "username")
      .select("-password")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

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

    // Remove all sessions
    user.removeAllSessions();
    await user.save();

    return res.json({
      success: true,
      message: "Logged out from all sessions successfully",
      sessionsRemoved: user.activeSessions.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};
