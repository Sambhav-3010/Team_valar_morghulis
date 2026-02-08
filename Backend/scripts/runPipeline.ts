import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runAllTransformers } from '../src/transformers/transformerRunner';
import { generateHRInsights, generateProductInsights, generateEngineeringInsights } from '../src/services/llm/insightGenerator';
import { Activity } from '../src/models/Activity';

// Load env vars
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    console.log('--- Running Transformers ---');
    await runAllTransformers();

    const activityCount = await Activity.countDocuments();
    console.log(`\nTotal Activities after transformation: ${activityCount}`);

    if (activityCount === 0) {
        console.warn('WARNING: No activities found. Insights will likely be empty.');
    } else {
        const bySource = await Activity.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);
        console.log('Activities by Source:', bySource);
    }

    console.log('\n--- Generating Insights for Project Alpha ---');
    const orgId = 'acme-corp';
    const alphaRepo = 'acme-corp/alpha-repo';
    const alphaJira = 'ALPHA';
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = new Date();

    try {
        console.log('Generating Product Insights (Jira: ALPHA)...');
        const productInsights = await generateProductInsights(orgId, alphaJira, startDate, endDate);
        console.log('Product Insights:', JSON.stringify(productInsights, null, 2));

        console.log('Generating Engineering Insights (GitHub: acme-corp/alpha-repo)...');
        const engInsights = await generateEngineeringInsights(orgId, alphaRepo, startDate, endDate);
        console.log('Engineering Insights:', JSON.stringify(engInsights, null, 2));

    } catch (err) {
        console.error('Error generating Alpha insights:', err);
    }

    console.log('\n--- Generating Insights for Project Beta ---');
    const betaRepo = 'acme-corp/beta-backend';
    const betaJira = 'BETA';

    try {
        console.log('Generating Product Insights (Jira: BETA)...');
        const productInsights = await generateProductInsights(orgId, betaJira, startDate, endDate);
        console.log('Product Insights:', JSON.stringify(productInsights, null, 2));
    } catch (err) {
        console.error('Error generating Beta insights:', err);
    }

    console.log('\n--- Generating HR Insights (Org Level) ---');
    try {
        const hrInsights = await generateHRInsights(orgId, startDate, endDate);
        console.log('HR Insights:', JSON.stringify(hrInsights, null, 2));
    } catch (err) {
        console.error('Error generating HR insights:', err);
    }

    console.log('\nPipeline complete!');
    process.exit(0);
};

run();
