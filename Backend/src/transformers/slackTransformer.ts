import mongoose from 'mongoose';
import { Activity, IActivity } from '../models';

// Import Insight model schema (we connect to the same DB)
const MentionSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    type: { type: String, enum: ['user', 'bot'] }
}, { _id: false });

const AttachmentSchema = new mongoose.Schema({
    name: String,
    url: String
}, { _id: false });

const InsightSchema = new mongoose.Schema({
    eventId: String,
    teamId: String,
    userId: String,
    userName: String,
    email: String,
    channelId: String,
    text: String,
    timestamp: Number,
    threadTs: Number,
    mentions: [MentionSchema],
    attachments: [AttachmentSchema],
    createdAt: Date
});

// Get or create the model
const Insight = mongoose.models.Insight ||
    mongoose.model('Insight', InsightSchema);

export interface TransformResult {
    processed: number;
    created: number;
    skipped: number;
    errors: number;
}

/**
 * Transform Insight (Slack message) records into Activity records
 * @param since - Only process messages after this date
 * @param teamId - Optional team ID filter
 */
export async function transformSlackMessages(
    since?: Date,
    teamId?: string
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
            query.timestamp = { $gte: Math.floor(since.getTime() / 1000) };
        }
        if (teamId) {
            query.teamId = teamId;
        }

        // Fetch slack messages
        const messages = await Insight.find(query).lean();
        result.processed = messages.length;

        for (const message of messages) {
            try {
                const sourceRefId = `slack:${message.eventId}`;

                // Check if already transformed
                const existing = await Activity.findOne({
                    source: 'slack',
                    sourceRefId
                });

                if (existing) {
                    result.skipped++;
                    continue;
                }

                // Skip if no email (can't link identity)
                if (!message.email || message.email === 'No Email') {
                    result.skipped++;
                    continue;
                }

                // Create activity record
                const activity: Partial<IActivity> = {
                    orgId: message.teamId || 'default',
                    source: 'slack',
                    activityType: 'message',
                    actorEmail: message.email,
                    projectAlias: message.channelId || 'general',
                    timestamp: new Date(message.timestamp * 1000),
                    sourceRefId,
                    metadata: {
                        userId: message.userId,
                        userName: message.userName,
                        channelId: message.channelId,
                        text: message.text?.substring(0, 500), // Limit text size
                        threadTs: message.threadTs,
                        mentionCount: message.mentions?.length || 0,
                        mentions: message.mentions?.map((m: any) => ({
                            email: m.email,
                            type: m.type
                        })) || [],
                        hasAttachments: (message.attachments?.length || 0) > 0
                    }
                };

                await Activity.create(activity);
                result.created++;
            } catch (err) {
                console.error(`Error transforming slack message ${message.eventId}:`, err);
                result.errors++;
            }
        }
    } catch (err) {
        console.error('Error in slack transformation:', err);
        throw err;
    }

    return result;
}

export default { transformSlackMessages };
