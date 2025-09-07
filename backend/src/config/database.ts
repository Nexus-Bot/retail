import mongoose from "mongoose";

const getMongoUri = (): string => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return process.env.MONGODB_URI_PROD || '';
    case 'development':
    default:
      return process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/retail-inventory-dev';
  }
};

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = getMongoUri();
    const env = process.env.NODE_ENV || 'development';

    if (!mongoUri) {
      console.warn("⚠️  No MongoDB URI provided, skipping database connection");
      return;
    }

    const conn = await mongoose.connect(mongoUri);

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
