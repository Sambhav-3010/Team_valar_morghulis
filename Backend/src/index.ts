import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import passport from "./utils/passport";
import authRoutes from "./routes/auth";
import analyticsRoutes from "./routes/analyticsRoutes";
import analyticsV2Routes from "./routes/analytics";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT as string;
const MONGO_URI = process.env.MONGO_URI as string;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/v2", analyticsV2Routes);

app.get("/", (req, res) => {
  res.send("Golden Data Layer Backend - Analytics API Ready");
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });