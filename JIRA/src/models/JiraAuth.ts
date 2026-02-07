
import mongoose, { Document, Schema } from 'mongoose';

export interface IJiraAuth extends Document {
    accessToken: string;
    refreshToken: string;
    scope: string;
    expiresIn: number;
    tokenType: string;
}

const jiraAuthSchema = new Schema<IJiraAuth>({
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    scope: { type: String },
    expiresIn: { type: Number },
    tokenType: { type: String }
}, {
    timestamps: true
});

const JiraAuth = mongoose.model<IJiraAuth>('JiraAuth', jiraAuthSchema);

export default JiraAuth;
