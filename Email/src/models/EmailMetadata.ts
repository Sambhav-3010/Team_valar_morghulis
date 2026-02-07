import mongoose, { Schema, Document } from "mongoose";

export interface IEmailMetadata extends Document {
    orgId: string;
    userEmail: string;
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
    userEmail: { type: String, required: true },
    messageId: { type: String, required: true },
    sender: { type: String },
    receiver: [{ type: String }],
    subject: { type: String },
    timestamp: { type: Number },
    threadId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

EmailMetadataSchema.index({ userEmail: 1, messageId: 1 }, { unique: true });

export const EmailMetadata = mongoose.model<IEmailMetadata>("EmailMetadata", EmailMetadataSchema);
