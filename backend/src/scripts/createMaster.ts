import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import { UserRole } from "../types/auth";

dotenv.config();

const createMasterUser = async () => {
  try {
    // Connect to database
    const mongoUri =
      process.env.MONGODB_URI_DEV ||
      "mongodb://localhost:27017/retail-inventory-dev";
    await mongoose.connect(mongoUri);
    console.log("📦 Connected to MongoDB");

    // Check if master user already exists
    const existingMaster = await User.findOne({ role: UserRole.MASTER });
    if (existingMaster) {
      console.log("⚠️  Master user already exists");
      process.exit(0);
    }

    // Create master user
    const masterUser = new User({
      username: "master",
      password: "masterl037884", // Will be hashed automatically
      role: UserRole.MASTER,
      status: "active",
    });

    await masterUser.save();
    console.log("✅ Master user created successfully");
    console.log("📋 Credentials:");
    console.log("   Username: master");
    console.log("   Password: masterl037884");
    console.log("   Role: master");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating master user:", error);
    process.exit(1);
  }
};

createMasterUser();
