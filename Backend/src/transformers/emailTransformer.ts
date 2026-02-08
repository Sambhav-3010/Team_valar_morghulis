import mongoose from 'mongoose';
import { Activity, IActivity } from '../models';

// Import EmailMetadata model schema (we connect to the same DB)
const EmailMetadataSchema = new mongoose.Schema({
    orgId: String,
    userEmail: String,
    messageId: String,
    sender: String,
    receiver: [String],
    subject: String,
    body: String,
    timestamp: Number,
    threadId: String,
    createdAt: Date
});

// Get or create the model (may already exist from Email service)
const EmailMetadata = mongoose.models.EmailMetadata ||
    mongoose.model('EmailMetadata', EmailMetadataSchema);

/**
 * Extract project alias from email subject
 * Looks for patterns like [PROJECT-NAME], PROJECT:, etc.
 */
function extractProjectFromSubject(subject: string): string {
    if (!subject) return 'unknown';

    // Try to match [PROJECT] pattern
    const bracketMatch = subject.match(/\[([^\]]+)\]/);
    if (bracketMatch) return bracketMatch[1].toLowerCase();

    // Try to match PROJECT: pattern
    const colonMatch = subject.match(/^([A-Za-z0-9_-]+):/);
    if (colonMatch) return colonMatch[1].toLowerCase();

    // Try to match common project prefixes
    const prefixMatch = subject.match(/^(RE:|FW:|FWD:)?\s*([A-Za-z0-9_-]+)\s*[-:]/i);
    if (prefixMatch && prefixMatch[2]) return prefixMatch[2].toLowerCase();

    return 'general';
}

export interface TransformResult {
    processed: number;
    created: number;
    skipped: number;
    errors: number;
}

/**
 * Transform EmailMetadata records into Activity records
 * @param since - Only process emails after this date
 * @param orgId - Optional org ID filter
 */
export async function transformEmails(
    since?: Date,
    orgId?: string
): Promise<TransformResult> {
    const result: TransformResult = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0
    };

    try {
        // Build query
        const query: Record<string, any> = {};
        if (since) {
            query.timestamp = { $gte: since.getTime() };
        }
        if (orgId) {
            query.orgId = orgId;
        }

        // Fetch emails
        const emails = await EmailMetadata.find(query).lean();
        result.processed = emails.length;

        for (const email of emails) {
            try {
                const sourceRefId = `email:${email.messageId}`;

                // Check if already transformed
                const existing = await Activity.findOne({
                    source: 'email',
                    sourceRefId
                });

                if (existing) {
                    result.skipped++;
                    continue;
                }

                // Create activity record
                const activity: Partial<IActivity> = {
                    orgId: email.orgId || 'default',
                    source: 'email',
                    activityType: 'message',
                    actorEmail: email.sender || email.userEmail,
                    projectAlias: extractProjectFromSubject(email.subject),
                    timestamp: new Date(email.timestamp),
                    sourceRefId,
                    metadata: {
                        receivers: email.receiver || [],
                        threadId: email.threadId,
                        subject: email.subject,
                        hasBody: !!email.body
                    }
                };

                await Activity.create(activity);
                result.created++;
            } catch (err) {
                console.error(`Error transforming email ${email.messageId}:`, err);
                result.errors++;
            }
        }
    } catch (err) {
        console.error('Error in email transformation:', err);
        throw err;
    }

    return result;
}

export default { transformEmails };
