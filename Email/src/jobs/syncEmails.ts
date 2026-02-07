import cron from "node-cron";
import { Integration } from "../models/Integration";
import { EmailMetadata } from "../models/EmailMetadata";
import { decryptToken } from "../utils/encryption";
import { fetchEmailMetadata, refreshAccessToken } from "../utils/gmailService";
import { encryptToken } from "../utils/encryption";

export function startEmailSyncJob() {
    cron.schedule("*/10 * * * *", async () => {
        console.log("[CRON] Starting email sync job...");

        try {
            const integrations = await Integration.find({ provider: "google" });

            for (const integration of integrations) {
                try {
                    let accessToken = decryptToken(integration.encryptedAccessToken);

                    if (new Date() > integration.expiry) {
                        const refreshToken = decryptToken(integration.encryptedRefreshToken);
                        const newCredentials = await refreshAccessToken(refreshToken);

                        accessToken = newCredentials.access_token as string;
                        integration.encryptedAccessToken = encryptToken(accessToken);

                        if (newCredentials.expiry_date) {
                            integration.expiry = new Date(newCredentials.expiry_date);
                        }

                        await integration.save();
                        console.log(`[CRON] Refreshed token for org ${integration.orgId}`);
                    }

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

                    console.log(`[CRON] Synced ${emails.length} emails for org ${integration.orgId}`);
                } catch (orgError) {
                    console.error(`[CRON] Error syncing org ${integration.orgId}:`, orgError);
                }
            }
        } catch (error) {
            console.error("[CRON] Job failed:", error);
        }
    });

    console.log("[CRON] Email sync job scheduled (every 10 minutes)");
}
