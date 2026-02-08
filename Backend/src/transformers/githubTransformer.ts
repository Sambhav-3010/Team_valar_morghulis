import mongoose from 'mongoose';
import { Activity, IActivity } from '../models';

// Import WebhookEvent model schema (we connect to the same DB)
const WebhookEventSchema = new mongoose.Schema({
    eventType: String,
    eventAction: String,
    installationId: Number,
    repositoryId: Number,
    repositoryFullName: String,
    senderId: Number,
    senderLogin: String,
    payload: mongoose.Schema.Types.Mixed,
    createdAt: Date
});

// Get or create the model
const WebhookEvent = mongoose.models.WebhookEvent ||
    mongoose.model('WebhookEvent', WebhookEventSchema);

// User model for email lookup
const GitHubUserSchema = new mongoose.Schema({
    githubId: Number,
    login: String,
    name: String,
    email: String,
    avatarUrl: String,
    type: String,
    installationId: Number,
    accessToken: String,
    scope: String
});

const GitHubUser = mongoose.models.User ||
    mongoose.model('User', GitHubUserSchema);

export interface TransformResult {
    processed: number;
    created: number;
    skipped: number;
    errors: number;
}

/**
 * Map GitHub event types to activity types
 */
function getActivityType(eventType: string, eventAction: string): string | null {
    switch (eventType) {
        case 'push':
            return 'commit';
        case 'pull_request':
            if (['opened', 'closed', 'merged', 'reopened'].includes(eventAction)) {
                return 'pull_request';
            }
            return null;
        case 'pull_request_review':
            return 'review';
        case 'deployment':
        case 'deployment_status':
            return 'deployment';
        default:
            return null;
    }
}

/**
 * Transform WebhookEvent records into Activity records
 * 
 * @param since - Only process events after this date
 * @param installationId - Optional installation ID filter
 */
export async function transformGitHubEvents(
    since?: Date,
    installationId?: number
): Promise<TransformResult> {
    const result: TransformResult = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0
    };

    // Cache for user email lookups
    const emailCache: Map<string, string> = new Map();

    try {
        // Build query
        const query: Record<string, any> = {};
        if (since) {
            query.createdAt = { $gte: since };
        }
        if (installationId) {
            query.installationId = installationId;
        }

        // Fetch webhook events
        const events = await WebhookEvent.find(query).lean();
        result.processed = events.length;

        for (const event of events) {
            try {
                // Determine activity type
                const activityType = getActivityType(event.eventType, event.eventAction);
                if (!activityType) {
                    result.skipped++;
                    continue;
                }

                const sourceRefId = `github:${event.eventType}:${event._id}`;

                // Check if already transformed
                const existing = await Activity.findOne({
                    source: 'github',
                    sourceRefId
                });

                if (existing) {
                    result.skipped++;
                    continue;
                }

                // Look up user email
                let actorEmail = emailCache.get(event.senderLogin);
                if (!actorEmail) {
                    const user = await GitHubUser.findOne({ login: event.senderLogin }).lean() as any;
                    if (user?.email) {
                        actorEmail = user.email;
                        emailCache.set(event.senderLogin, user.email);
                    }
                }

                // If no email found, use login as placeholder
                if (!actorEmail) {
                    actorEmail = `${event.senderLogin}@github.local`;
                }

                // Build metadata based on event type
                let metadata: Record<string, any> = {
                    eventType: event.eventType,
                    eventAction: event.eventAction,
                    senderLogin: event.senderLogin,
                    repositoryId: event.repositoryId
                };

                // Extract additional metadata from payload
                if (event.payload) {
                    if (event.eventType === 'push') {
                        metadata.commits = event.payload.commits?.length || 0;
                        metadata.ref = event.payload.ref;
                        metadata.before = event.payload.before;
                        metadata.after = event.payload.after;
                    } else if (event.eventType === 'pull_request') {
                        metadata.prNumber = event.payload.pull_request?.number;
                        metadata.prTitle = event.payload.pull_request?.title;
                        metadata.prState = event.payload.pull_request?.state;
                        metadata.merged = event.payload.pull_request?.merged;
                    } else if (event.eventType === 'pull_request_review') {
                        metadata.prNumber = event.payload.pull_request?.number;
                        metadata.reviewState = event.payload.review?.state;
                    } else if (event.eventType === 'deployment' || event.eventType === 'deployment_status') {
                        metadata.environment = event.payload.deployment?.environment;
                        metadata.deploymentState = event.payload.deployment_status?.state;
                    }
                }

                // Create activity record
                const activity: Partial<IActivity> = {
                    orgId: event.repositoryFullName?.split('/')[0] || 'default',
                    source: 'github',
                    activityType: activityType as any,
                    actorEmail: actorEmail,
                    projectAlias: event.repositoryFullName || 'unknown',
                    timestamp: event.createdAt || new Date(),
                    sourceRefId,
                    metadata
                };

                await Activity.create(activity);
                result.created++;
            } catch (err) {
                console.error(`Error transforming GitHub event ${event._id}:`, err);
                result.errors++;
            }
        }
    } catch (err) {
        console.error('Error in GitHub transformation:', err);
        throw err;
    }

    return result;
}

export default { transformGitHubEvents };
