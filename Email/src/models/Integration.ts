import mongoose, { Schema, Document } from "mongoose";

export interface IIntegration extends Document {
    orgId: string;
    userEmail: string;
    provider: string;
    encryptedAccessToken: string;
    encryptedRefreshToken: string;
    expiry: Date;
    createdAt: Date;
}

const IntegrationSchema: Schema = new Schema({
    orgId: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true },
    provider: { type: String, default: "google" },
    encryptedAccessToken: { type: String, required: true },
    encryptedRefreshToken: { type: String, required: true },
    expiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

export const Integration = mongoose.model<IIntegration>("Integration", IntegrationSchema);
