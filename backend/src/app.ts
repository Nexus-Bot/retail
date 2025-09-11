import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { cacheService } from "./config/cache";
import v1Routes from "./routes/v1";

dotenv.config();

// Initialize database and cache
connectDB();
cacheService.connect().catch((err) => {
  console.error("Failed to connect to cache:", err);
});

const app = express();

// Enable compression for all responses
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level (1=fast, 9=best)
    threshold: 1024, // Only compress responses > 1KB
  })
);

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    message: "Retail Inventory Management API - TypeScript",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    availableVersions: ["v1"],
    endpoints: {
      v1: "/api/v1",
    },
  });
});

app.use("/api/v1", v1Routes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  }
);

export default app;
