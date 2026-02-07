import { Router, Request, Response } from "express";
import { getAuthUrl, getTokens, fetchEmailMetadata, getUserEmail } from "../utils/gmailService";
import { encryptToken, decryptToken } from "../utils/encryption";
import { Organization } from "../models/Organization";
import { Integration } from "../models/Integration";
import { EmailMetadata } from "../models/EmailMetadata";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/auth/google", (req: Request, res: Response) => {
    const url = getAuthUrl();
    res.redirect(url);
});

router.get("/oauth/google/callback", async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Missing authorization code");
    }

    try {
        const tokens = await getTokens(code as string);
        const userEmail = await getUserEmail(tokens.access_token as string);
        const domain = userEmail.split("@")[1];

        let org = await Organization.findOne({ domain });
        if (!org) {
            org = new Organization({
                orgId: uuidv4(),
                domain: domain
            });
            await org.save();
            console.log(`[AUTH] New organization created: ${domain}`);
        }

        const encryptedAccess = encryptToken(tokens.access_token as string);
        const encryptedRefresh = encryptToken(tokens.refresh_token as string);

        await Integration.findOneAndUpdate(
            { userEmail: userEmail },
            {
                orgId: org.orgId,
                userEmail: userEmail,
                provider: "google",
                encryptedAccessToken: encryptedAccess,
                encryptedRefreshToken: encryptedRefresh,
                expiry: new Date(tokens.expiry_date as number)
            },
            { upsert: true, new: true }
        );

        console.log(`[AUTH] User ${userEmail} connected to organization ${domain}`);
        res.send(`<html><body><h1>Connected!</h1><p>Email: ${userEmail}</p><p>Organization: ${domain}</p><p>You can close this window.</p></body></html>`);
    } catch (error) {
        console.error("[AUTH] OAuth Error:", error);
        res.status(500).send("Authentication failed");
    }
});

router.get("/sync/emails", async (req: Request, res: Response) => {
    try {
        const integrations = await Integration.find({ provider: "google" });
        let totalNew = 0;
        let totalSkipped = 0;

        for (const integration of integrations) {
            try {
                const accessToken = decryptToken(integration.encryptedAccessToken);
                const emails = await fetchEmailMetadata(accessToken, 15);

                for (const email of emails) {
                    if (!email.messageId) continue;

                    const existing = await EmailMetadata.findOne({
                        userEmail: integration.userEmail,
                        messageId: email.messageId
                    });

                    if (!existing) {
                        await EmailMetadata.create({
                            orgId: integration.orgId,
                            userEmail: integration.userEmail,
                            messageId: email.messageId,
                            threadId: email.threadId || "",
                            sender: email.sender,
                            receiver: email.receiver,
                            subject: email.subject,
                            body: email.body,
                            timestamp: email.timestamp
                        });
                        totalNew++;
                    } else {
                        totalSkipped++;
                    }
                }

                console.log(`[SYNC] Processed ${emails.length} emails for ${integration.userEmail}`);
            } catch (userError) {
                console.error(`[SYNC] Error syncing ${integration.userEmail}:`, userError);
            }
        }

        res.json({ success: true, newEmails: totalNew, skipped: totalSkipped, users: integrations.length });
    } catch (error) {
        console.error("[SYNC] Error:", error);
        res.status(500).json({ success: false, error: "Sync failed" });
    }
});

router.get("/users", async (req: Request, res: Response) => {
    try {
        const integrations = await Integration.find({ provider: "google" }).select("userEmail orgId createdAt");
        res.json({ success: true, users: integrations });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
});

router.get("/emails", async (req: Request, res: Response) => {
    try {
        const emails = await EmailMetadata.find().sort({ timestamp: -1 }).limit(50);
        res.json({ success: true, count: emails.length, emails });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch emails" });
    }
});

router.get("/emails/:userEmail", async (req: Request, res: Response) => {
    try {
        const { userEmail } = req.params;
        const emails = await EmailMetadata.find({ userEmail }).sort({ timestamp: -1 }).limit(15);
        res.json({ success: true, count: emails.length, emails });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch emails" });
    }
});

export default router;
