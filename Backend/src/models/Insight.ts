import mongoose, { Schema, Document } from 'mongoose';

export type InsightCategory = 'observation' | 'anomaly' | 'trend' | 'suggestion';
export type InsightPersona = 'hr' | 'engineering' | 'product' | 'all';

export interface IInsight extends Document {
    orgId: string;
    category: InsightCategory;
    persona: InsightPersona;
    title: string;
    body: string;
    confidence: number;             // 0-1 confidence score
    relatedMetric?: string;         // e.g., "SPACE - Satisfaction"
    relatedProjectId?: string;      // Project context
    relatedEmail?: string;          // Person context
    source: string[];               // e.g., ["Slack", "GitHub"]
    generatedAt: Date;
    expiresAt?: Date;               // Optional TTL for insights
    createdAt: Date;
    updatedAt: Date;
}

const InsightSchema = new Schema<IInsight>(
    {
        orgId: { type: String, required: true, index: true },
        category: {
            type: String,
            enum: ['observation', 'anomaly', 'trend', 'suggestion', 'risk', 'praise', 'workload', 'process'],
            required: true
        },
        persona: {
            type: String,
            required: true,
            enum: ['hr', 'engineering', 'product', 'all']
        },
        title: { type: String, required: true },
        body: { type: String, required: true },
        confidence: { type: Number, required: true, min: 0, max: 1 },
        relatedMetric: { type: String },
        relatedProjectId: { type: String, index: true },
        relatedEmail: { type: String, index: true },
        source: [{ type: String }],
        generatedAt: { type: Date, required: true, default: Date.now },
        expiresAt: { type: Date }
    },
    {
        timestamps: true
    }
);

// Index for fetching recent insights
InsightSchema.index({ orgId: 1, generatedAt: -1 });
InsightSchema.index({ orgId: 1, persona: 1, generatedAt: -1 });

export const Insight = mongoose.model<IInsight>('Insight', InsightSchema);
