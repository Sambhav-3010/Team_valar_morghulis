import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("[DB] Connected to MongoDB");
    } catch (error) {
        console.error("[DB] Connection Error:", error);
        process.exit(1);
    }
};
