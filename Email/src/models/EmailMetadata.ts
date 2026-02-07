import mongoose, { Schema, Document } from "mongoose";

export interface IEmailMetadata extends Document {
    orgId: string;
    messageId: string;
    sender: string;
    receiver: string[];
    subject: string;
    timestamp: number;
    threadId: string;
    createdAt: Date;
}

const EmailMetadataSchema: Schema = new Schema({
    orgId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    sender: { type: String },
    receiver: [{ type: String }],
    subject: { type: String },
    timestamp: { type: Number },
    threadId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export const EmailMetadata = mongoose.model<IEmailMetadata>("EmailMetadata", EmailMetadataSchema);
