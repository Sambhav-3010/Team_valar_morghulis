import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.js";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

export interface AuthRequest extends Request {
    user?: any;
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const cookieName = process.env.COOKIE_NAME || "token";
        const token = req.cookies?.[cookieName];

        if (!token) {
            res.status(401).json({ error: "Unauthorized - No token provided" });
            return;
        }

        const decoded = verifyJwt(token) as { userId: string; email: string; name: string };

        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ error: "Unauthorized - User not found" });
            return;
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: "Unauthorized - Invalid token" });
        return;
    }
}
