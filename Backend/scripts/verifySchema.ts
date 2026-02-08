import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Insight } from '../src/models/Insight';
import { getSpaceMetrics, getFlowMetrics, getDoraMetrics } from '../src/services/metrics/metricsService';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB connected');

        console.log('\n--- Verifying Metrics Service ---');
        const space = getSpaceMetrics();
        console.log('SPACE Metrics keys:', Object.keys(space).join(', '));
        const flow = getFlowMetrics();
        console.log('FLOW Metrics keys:', Object.keys(flow).join(', '));
        const dora = getDoraMetrics();
        console.log('DORA Metrics keys:', Object.keys(dora).join(', '));

        if (!space.satisfaction || !flow.flowVelocity || !dora.deploymentFrequency) {
            console.error('❌ Metrics service returning incomplete data');
        } else {
            console.log('✅ Metrics service structure looks correct');
        }

        console.log('\n--- Verifying Insight Schema ---');
        const count = await Insight.countDocuments();
        console.log(`Found ${count} insights.`);

        if (count > 0) {
            const insight = await Insight.findOne();
            console.log('Sample Insight:', JSON.stringify(insight?.toJSON(), null, 2));

            // Check for 'source' field
            // @ts-ignore
            if (insight && Array.isArray(insight.source)) {
                console.log('✅ Insight has correct `source` field (array)');
            } else {
                console.error('❌ Insight missing `source` field or incorrect type');
                // @ts-ignore
                console.log('Actual value:', insight?.source);
            }

            // Check for 'relatedMetric'
            if (insight && insight.relatedMetric) {
                console.log('✅ Insight has `relatedMetric` field');
            } else {
                console.log('⚠️ Insight missing `relatedMetric` (may be optional)');
            }
        } else {
            console.log('⚠️ No insights found to verify schema against. Ensure pipeline ran successfully.');
        }

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await mongoose.disconnect();
    }
};

verify();
