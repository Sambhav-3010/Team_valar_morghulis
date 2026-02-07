import mongoose, { Schema, Document } from 'mongoose';

export interface IRepository extends Document {
    githubId: number;
    name: string;
    fullName: string;
    owner: string;
    ownerType: 'User' | 'Organization';
    private: boolean;
    description: string | null;
    language: string | null;
    defaultBranch: string;
    stargazersCount: number;
    forksCount: number;
    openIssuesCount: number;
    lastSyncedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const RepositorySchema = new Schema<IRepository>(
    {
        githubId: { type: Number, required: true, unique: true, index: true },
        name: { type: String, required: true },
        fullName: { type: String, required: true, unique: true, index: true },
        owner: { type: String, required: true, index: true },
        ownerType: { type: String, enum: ['User', 'Organization'], required: true },
        private: { type: Boolean, default: false },
        description: { type: String, default: null },
        language: { type: String, default: null },
        defaultBranch: { type: String, default: 'main' },
        stargazersCount: { type: Number, default: 0 },
        forksCount: { type: Number, default: 0 },
        openIssuesCount: { type: Number, default: 0 },
        lastSyncedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

export const Repository = mongoose.model<IRepository>('Repository', RepositorySchema);
