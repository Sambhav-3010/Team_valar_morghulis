import { Router, Request, Response } from "express";
import passport from "../utils/passport";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`,
    }),
    (req: Request, res: Response) => {
        if (!req.user) {
            res.redirect(`${FRONTEND_URL}/login?error=no_user`);
            return;
        }
        setAuthCookie(res, req.user);
        res.redirect(`${FRONTEND_URL}/dashboard`);
    }
);

router.get("/logout", (req: Request, res: Response) => {
    clearAuthCookie(res);
    res.json({ message: "Logged out successfully" });
});

router.get("/me", authMiddleware, (req: AuthRequest, res: Response) => {
    res.json({
        user: {
            id: req.user._id,
            user_id: req.user.user_id,
            email: req.user.primary_email,
            full_name: req.user.full_name,
            display_name: req.user.display_name,
            role: req.user.role,
            team: req.user.team,
        },
    });
});

export default router;
