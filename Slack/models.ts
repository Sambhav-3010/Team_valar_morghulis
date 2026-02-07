import mongoose, { Schema, Document } from "mongoose";

export interface IRawEvent extends Document {
    type: string;
    event: any;
    raw: any;
    createdAt: Date;
}

const RawEventSchema: Schema = new Schema({
    type: { type: String, required: true },
    event: { type: Schema.Types.Mixed },
    raw: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

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
    eventId: mongoose.Types.ObjectId;
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
    raw: any;
    createdAt: Date;
}

const InsightSchema: Schema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: 'RawEvent' },
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
    raw: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

export const RawEvent = mongoose.model<IRawEvent>("RawEvent", RawEventSchema);
export const Insight = mongoose.model<IInsight>("Insight", InsightSchema);
