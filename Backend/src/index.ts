import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import passport from "./utils/passport.js";
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT as string;
const MONGO_URI = process.env.MONGO_URI as string;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
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