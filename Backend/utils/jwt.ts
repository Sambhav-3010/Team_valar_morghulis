import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

function signJwt(payload: string | object): string {
    const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] };
    return jwt.sign(payload, JWT_SECRET, options);
}

function verifyJwt(token: string): string | jwt.JwtPayload {
    return jwt.verify(token, JWT_SECRET);
}

export { signJwt, verifyJwt };
