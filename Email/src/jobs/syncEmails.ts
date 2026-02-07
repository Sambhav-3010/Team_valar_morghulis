import cron from "node-cron";
import { Integration } from "../models/Integration";
import { EmailMetadata } from "../models/EmailMetadata";
import { decryptToken, encryptToken } from "../utils/encryption";
import { fetchEmailMetadata, refreshAccessToken } from "../utils/gmailService";

export function startEmailSyncJob() {
    cron.schedule("*/10 * * * *", async () => {
        console.log("[CRON] Starting email sync job...");

        try {
            const integrations = await Integration.find({ provider: "google" });
            console.log(`[CRON] Found ${integrations.length} users to sync`);

            for (const integration of integrations) {
                try {
                    let accessToken = decryptToken(integration.encryptedAccessToken);

                    if (new Date() > integration.expiry) {
                        console.log(`[CRON] Refreshing expired token for ${integration.userEmail}`);
                        const refreshToken = decryptToken(integration.encryptedRefreshToken);
                        const newCredentials = await refreshAccessToken(refreshToken);

                        accessToken = newCredentials.access_token as string;
                        integration.encryptedAccessToken = encryptToken(accessToken);

                        if (newCredentials.expiry_date) {
                            integration.expiry = new Date(newCredentials.expiry_date);
                        }

                        await integration.save();
                    }

                    const emails = await fetchEmailMetadata(accessToken, 50);

                    for (const email of emails) {
                        await EmailMetadata.findOneAndUpdate(
                            { userEmail: integration.userEmail, messageId: email.messageId },
                            {
                                orgId: integration.orgId,
                                userEmail: integration.userEmail,
                                ...email
                            },
                            { upsert: true }
                        );
                    }

                    console.log(`[CRON] Synced ${emails.length} emails for ${integration.userEmail}`);
                } catch (userError) {
                    console.error(`[CRON] Error syncing ${integration.userEmail}:`, userError);
                }
            }

            console.log("[CRON] Email sync job completed");
        } catch (error) {
            console.error("[CRON] Job failed:", error);
        }
    });

    console.log("[CRON] Email sync job scheduled (every 10 minutes)");
}
