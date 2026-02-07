import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
    orgId: string;
    domain: string;
    createdAt: Date;
}

const OrganizationSchema: Schema = new Schema({
    orgId: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Organization = mongoose.model<IOrganization>("Organization", OrganizationSchema);
