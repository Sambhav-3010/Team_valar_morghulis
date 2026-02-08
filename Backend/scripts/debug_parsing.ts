
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateProductInsights } from '../src/services/llm/insightGenerator';
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

    console.log('\n--- Debugging Product Insights Parsing ---');
    const orgId = 'acme-corp';
    const projectId = 'ALPHA'; // Jira uses project key
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Check if we have data first
    const count = await Activity.countDocuments({
        orgId,
        projectAlias: projectId,
        source: 'jira'
    });
    console.log(`Found ${count} Jira activities for ${projectId}`);

    if (count === 0) {
        console.log('No data to analyze. Exiting.');
        process.exit(0);
    }

    try {
        console.log('Calling generateProductInsights...');
        const productInsights = await generateProductInsights(orgId, projectId, startDate, endDate);
        console.log('--- Final Result ---');
        console.log(JSON.stringify(productInsights, null, 2));
    } catch (err) {
        console.error('Error generating insights:', err);
    }

    process.exit(0);
};

run();
