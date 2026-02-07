import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email"
];

export function getAuthUrl(): string {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
    });
}

export async function getTokens(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}

function extractBody(payload: any): string {
    if (!payload) return "";

    if (payload.body?.data) {
        return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === "text/plain" && part.body?.data) {
                return Buffer.from(part.body.data, "base64").toString("utf-8");
            }
        }
        for (const part of payload.parts) {
            if (part.mimeType === "text/html" && part.body?.data) {
                return Buffer.from(part.body.data, "base64").toString("utf-8");
            }
        }
        for (const part of payload.parts) {
            const nested = extractBody(part);
            if (nested) return nested;
        }
    }

    return "";
}

export async function fetchEmailMetadata(accessToken: string, maxResults: number = 15) {
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const listResponse = await gmail.users.messages.list({
        userId: "me",
        maxResults: maxResults
    });

    const messages = listResponse.data.messages || [];
    const emailData = [];

    for (const msg of messages) {
        const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id as string,
            format: "full"
        });

        const headers = detail.data.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || "";

        const body = extractBody(detail.data.payload);

        emailData.push({
            messageId: msg.id,
            threadId: detail.data.threadId,
            sender: getHeader("From"),
            receiver: getHeader("To").split(",").map((r: string) => r.trim()),
            subject: getHeader("Subject"),
            body: body,
            timestamp: Math.floor(parseInt(detail.data.internalDate || "0") / 1000)
        });
    }

    return emailData;
}

export async function getUserEmail(accessToken: string): Promise<string> {
    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    return userInfo.data.email || "";
}
