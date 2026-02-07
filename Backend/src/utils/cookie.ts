import { CookieOptions, Response } from "express";
import { signJwt } from "./jwt";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 48 * 60 * 60 * 1000,
    path: "/",
};

export function setAuthCookie(res: Response, user: any): void {
    const payload = {
        userId: user._id.toString(),
        email: user.primary_email,
        name: user.full_name,
    };
    const token = signJwt(payload);
    const cookieName = process.env.COOKIE_NAME || "token";
    res.cookie(cookieName, token, cookieOptions);
}

export function clearAuthCookie(res: Response): void {
    const cookieName = process.env.COOKIE_NAME || "token";
    res.clearCookie(cookieName, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
    });
}
