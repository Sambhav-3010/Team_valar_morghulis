import mongoose, { Schema, Document } from 'mongoose';

// Source systems that generate activities
export type ActivitySource = 'email' | 'slack' | 'github' | 'jira';

// Types of activities that can be recorded
export type ActivityType =
    | 'message'           // Email or Slack message
    | 'commit'            // GitHub commit
    | 'pull_request'      // GitHub PR
    | 'review'            // GitHub PR review
    | 'ticket_created'    // Jira ticket creation
    | 'status_change'     // Jira status change
    | 'ticket_updated'    // Jira ticket update
    | 'deployment';       // GitHub deployment

export interface IActivity extends Document {
    orgId: string;
    source: ActivitySource;
    activityType: ActivityType;
    actorEmail: string;
    actorUserId?: string;           // Resolved identity reference
    projectAlias: string;           // Raw project identifier from source
    projectId?: string;             // Canonical project reference
    timestamp: Date;
    metadata: Record<string, any>;  // Source-specific data
    sourceRefId: string;            // Unique ID from original system
    createdAt: Date;
    updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
    {
        orgId: { type: String, required: true, index: true },
        source: {
            type: String,
            required: true,
            enum: ['email', 'slack', 'github', 'jira'],
            index: true
        },
        activityType: {
            type: String,
            required: true,
            enum: [
                'message', 'commit', 'pull_request', 'review',
                'ticket_created', 'status_change', 'ticket_updated', 'deployment'
            ],
            index: true
        },
        actorEmail: { type: String, required: true, index: true },
        actorUserId: { type: String, index: true },
        projectAlias: { type: String, required: true, index: true },
        projectId: { type: String, index: true },
        timestamp: { type: Date, required: true, index: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
        sourceRefId: { type: String, required: true }
    },
    {
        timestamps: true
    }
);

// Compound indexes for common queries
ActivitySchema.index({ orgId: 1, timestamp: -1 });
ActivitySchema.index({ actorEmail: 1, timestamp: -1 });
ActivitySchema.index({ projectId: 1, timestamp: -1 });
ActivitySchema.index({ source: 1, sourceRefId: 1 }, { unique: true }); // Prevent duplicates

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
