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

    console.log('\n--- Generating Insights for Project Phoenix ---');
    const orgId = 'valar-morghulis';
    const phoenixId = 'org/project-phoenix'; // Using alias as ID for now based on transformer logic
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = new Date(); 

    try {
        console.log('Generating Product Insights...');
        const productInsights = await generateProductInsights(orgId, phoenixId, startDate, endDate);
        console.log('Product Insights:', JSON.stringify(productInsights, null, 2));

        console.log('Generating Engineering Insights...');
        const engInsights = await generateEngineeringInsights(orgId, phoenixId, startDate, endDate);
        console.log('Engineering Insights:', JSON.stringify(engInsights, null, 2));

    } catch (err) {
        console.error('Error generating Phoenix insights:', err);
    }

    console.log('\n--- Generating Insights for Project Orion ---');
    const orionId = 'org/project-orion';

    try {
        console.log('Generating Product Insights...');
        const productInsights = await generateProductInsights(orgId, orionId, startDate, endDate);
        console.log('Product Insights:', JSON.stringify(productInsights, null, 2));
    } catch (err) {
        console.error('Error generating Orion insights:', err);
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
