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
        }

        const encryptedAccess = encryptToken(tokens.access_token as string);
        const encryptedRefresh = encryptToken(tokens.refresh_token as string);

        await Integration.findOneAndUpdate(
            { orgId: org.orgId },
            {
                orgId: org.orgId,
                provider: "google",
                encryptedAccessToken: encryptedAccess,
                encryptedRefreshToken: encryptedRefresh,
                expiry: new Date(tokens.expiry_date as number)
            },
            { upsert: true, new: true }
        );

        console.log(`[AUTH] Organization ${domain} connected successfully`);
        res.send("<html><body><h1>Google Workspace Connected!</h1><p>You can close this window.</p></body></html>");
    } catch (error) {
        console.error("[AUTH] OAuth Error:", error);
        res.status(500).send("Authentication failed");
    }
});

router.get("/sync/emails", async (req: Request, res: Response) => {
    try {
        const integrations = await Integration.find({ provider: "google" });

        for (const integration of integrations) {
            const accessToken = decryptToken(integration.encryptedAccessToken);
            const emails = await fetchEmailMetadata(accessToken);

            for (const email of emails) {
                await EmailMetadata.findOneAndUpdate(
                    { messageId: email.messageId },
                    {
                        orgId: integration.orgId,
                        ...email
                    },
                    { upsert: true }
                );
            }

            console.log(`[SYNC] Synced ${emails.length} emails for org ${integration.orgId}`);
        }

        res.json({ success: true, message: "Email sync completed" });
    } catch (error) {
        console.error("[SYNC] Error:", error);
        res.status(500).json({ success: false, error: "Sync failed" });
    }
});

export default router;
