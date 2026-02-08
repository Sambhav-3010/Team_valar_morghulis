import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectAliases {
    github?: string[];      // Repository names (e.g., "org/repo")
    slack?: string[];       // Channel IDs
    jira?: string[];        // Workspace/project keys
    email?: string[];       // Subject tokens/patterns
}

export interface IProject extends Document {
    projectId: string;      // Canonical project ID
    name: string;           // Human-readable project name
    description?: string;   // Project description
    orgId: string;          // Organization reference
    aliases: IProjectAliases;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectAliasesSchema = new Schema<IProjectAliases>(
    {
        github: [{ type: String }],
        slack: [{ type: String }],
        jira: [{ type: String }],
        email: [{ type: String }]
    },
    { _id: false }
);

const ProjectSchema = new Schema<IProject>(
    {
        projectId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        name: { type: String, required: true },
        description: { type: String },
        orgId: { type: String, required: true, index: true },
        aliases: { type: ProjectAliasesSchema, default: {} },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true
    }
);

// Indexes for alias lookups
ProjectSchema.index({ 'aliases.github': 1 });
ProjectSchema.index({ 'aliases.slack': 1 });
ProjectSchema.index({ 'aliases.jira': 1 });
ProjectSchema.index({ 'aliases.email': 1 });

// Compound index for org-based queries
ProjectSchema.index({ orgId: 1, isActive: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
