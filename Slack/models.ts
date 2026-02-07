import mongoose, { Schema, Document } from "mongoose";

export interface IMention {
    id: string;
    name: string;
    email: string;
    type: 'user' | 'bot';
}

export interface IAttachment {
    name: string;
    url: string;
}

export interface IInsight extends Document {
    eventId: string;
    teamId: string;
    userId: string;
    userName: string;
    email: string;
    channelId: string;
    text: string;
    timestamp: number;
    threadTs: number | null;
    mentions: IMention[];
    attachments: IAttachment[];
    createdAt: Date;
}

const InsightSchema: Schema = new Schema({
    eventId: { type: String, required: true },
    teamId: { type: String },
    userId: { type: String },
    userName: { type: String },
    email: { type: String },
    channelId: { type: String },
    text: { type: String },
    timestamp: { type: Number },
    threadTs: { type: Number },
    mentions: [{
        id: String,
        name: String,
        email: String,
        type: { type: String, enum: ['user', 'bot'] }
    }],
    attachments: [{
        name: String,
        url: String
    }],
    createdAt: { type: Date, default: Date.now }
});

export const Insight = mongoose.model<IInsight>("Insight", InsightSchema);
