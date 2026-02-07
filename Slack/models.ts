import mongoose, { Schema, Document } from "mongoose";

// Raw Event Schema
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

// Structured Insight Schema
export interface IInsight extends Document {
    eventId: mongoose.Types.ObjectId;
    userId: string;
    channelId: string;
    text: string;
    analysis: {
        taskName?: string;
        assignee?: string;
        deadline?: Date;
        sentiment?: string;
        labels: string[];
    };
    createdAt: Date;
}

const InsightSchema: Schema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: 'RawEvent' },
    userId: { type: String },
    channelId: { type: String },
    text: { type: String },
    analysis: {
        taskName: String,
        assignee: String,
        deadline: Date,
        sentiment: String,
        labels: [String]
    },
    createdAt: { type: Date, default: Date.now }
});

export const RawEvent = mongoose.model<IRawEvent>("RawEvent", RawEventSchema);
export const Insight = mongoose.model<IInsight>("Insight", InsightSchema);
