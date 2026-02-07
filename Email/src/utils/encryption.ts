import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

export function encryptToken(token: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY as string, "utf-8");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
}

export function decryptToken(encryptedToken: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY as string, "utf-8");
    const parts = encryptedToken.split(":");
    const iv = Buffer.from(parts.shift() as string, "hex");
    const encryptedText = parts.join(":");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
