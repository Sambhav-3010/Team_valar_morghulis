import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
    githubId: number;
    login: string;
    installationId: number | null;
    name: string | null;
    description: string | null;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        githubId: { type: Number, required: true, unique: true, index: true },
        login: { type: String, required: true, unique: true, index: true },
        installationId: { type: Number, default: null },
        name: { type: String, default: null },
        description: { type: String, default: null },
        avatarUrl: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
