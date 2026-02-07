import mongoose, { Document, Schema } from 'mongoose';

export interface ISyncState extends Document {
    resourceId: string;
    resourceName: string;
    lastFetched: Date;
}

const syncStateSchema = new Schema<ISyncState>({
    resourceId: { type: String, required: true, unique: true },
    resourceName: { type: String },
    lastFetched: { type: Date, required: true }
}, {
    timestamps: true
});

const SyncState = mongoose.model<ISyncState>('SyncState', syncStateSchema);

export default SyncState;
