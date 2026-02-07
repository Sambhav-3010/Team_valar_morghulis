import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
    eventType: string;
    eventAction: string;
    installationId: number;
    repositoryId: number;
    repositoryFullName: string;
    senderId: number;
    senderLogin: string;
    payload: any;
    createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
    {
        eventType: { type: String, required: true, index: true },
        eventAction: { type: String, required: true },
        installationId: { type: Number, required: true, index: true },
        repositoryId: { type: Number, required: true, index: true },
        repositoryFullName: { type: String, required: true, index: true },
        senderId: { type: Number, required: true },
        senderLogin: { type: String, required: true, index: true },
        payload: { type: Schema.Types.Mixed, default: {} },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for querying by date range
WebhookEventSchema.index({ createdAt: -1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
