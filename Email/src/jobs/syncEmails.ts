import cron from "node-cron";
import { Integration } from "../models/Integration";
import { EmailMetadata } from "../models/EmailMetadata";
import { decryptToken, encryptToken } from "../utils/encryption";
import { fetchEmailMetadata, refreshAccessToken } from "../utils/gmailService";

export function startEmailSyncJob() {
    cron.schedule("*/30 * * * *", async () => {
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

                    const emails = await fetchEmailMetadata(accessToken, 15);
                    let newCount = 0;

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
                            newCount++;
                        }
                    }

                    console.log(`[CRON] ${integration.userEmail}: ${newCount} new emails (${emails.length - newCount} skipped)`);
                } catch (userError) {
                    console.error(`[CRON] Error syncing ${integration.userEmail}:`, userError);
                }
            }

            console.log("[CRON] Email sync job completed");
        } catch (error) {
            console.error("[CRON] Job failed:", error);
        }
    });

    console.log("[CRON] Email sync job scheduled (every 30 minutes)");
}
