import mongoose, { Schema, Document } from 'mongoose';

export interface IIdentity extends Document {
    primaryEmail: string;           // Primary identifier
    alternateEmails: string[];      // Alternative email addresses
    githubLogin?: string;           // GitHub username
    githubId?: number;              // GitHub user ID
    slackUserId?: string;           // Slack user ID
    slackTeamId?: string;           // Slack workspace ID
    jiraAccountId?: string;         // Jira account ID
    displayName: string;            // Friendly display name
    orgId: string;                  // Organization reference
    defaultProjectId?: string;      // Primary project assignment
    createdAt: Date;
    updatedAt: Date;
}

const IdentitySchema = new Schema<IIdentity>(
    {
        primaryEmail: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        alternateEmails: [{
            type: String,
            lowercase: true,
            trim: true
        }],
        githubLogin: { type: String, index: true },
        githubId: { type: Number, index: true },
        slackUserId: { type: String, index: true },
        slackTeamId: { type: String },
        jiraAccountId: { type: String, index: true },
        displayName: { type: String, required: true },
        orgId: { type: String, required: true, index: true },
        defaultProjectId: { type: String, index: true }
    },
    {
        timestamps: true
    }
);

// Index for looking up by alternate emails
IdentitySchema.index({ alternateEmails: 1 });

// Compound index for org-based lookups
IdentitySchema.index({ orgId: 1, primaryEmail: 1 });

export const Identity = mongoose.model<IIdentity>('Identity', IdentitySchema);
