import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    githubId: number;
    login: string;
    name: string | null;
    email: string | null;
    avatarUrl: string;
    type: 'User' | 'Organization';
    installationId: number | null;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    scope: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        githubId: { type: Number, required: true, unique: true, index: true },
        login: { type: String, required: true, index: true },
        name: { type: String, default: null },
        email: { type: String, default: null },
        avatarUrl: { type: String, required: true },
        type: { type: String, enum: ['User', 'Organization'], default: 'User' },
        installationId: { type: Number, default: null },
        accessToken: { type: String, required: true },
        refreshToken: { type: String, default: null },
        tokenExpiresAt: { type: Date, default: null },
        scope: { type: String, default: '' },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model<IUser>('User', UserSchema);
