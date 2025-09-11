import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const env = process.env.NODE_ENV || "development";

    if (!mongoUri) {
      console.warn("⚠️  No MongoDB URI provided, skipping database connection");
      return;
    }

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log(`🌍 Environment: ${env}`);
  } catch (error) {
    console.error(
      "❌ Error connecting to MongoDB:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

export default connectDB;
