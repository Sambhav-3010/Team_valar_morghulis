
// Manual Monkey Patching for verification without Jest
import { Activity } from '../src/models/Activity'; // Assume this is a Mongoose model class
import * as featherless from '../src/services/llm/featherlessProvider';
import { generateHRInsights, generateProductInsights, generateEngineeringInsights } from '../src/services/llm/insightGenerator';

// Mock Data
const mockActivities = [
    {
        orgId: 'org1',
        source: 'slack',
        activityType: 'message',
        actorEmail: 'alice@example.com',
        timestamp: new Date(),
        metadata: { text: 'Great work on the release!', channel: 'general' }
    },
    {
        orgId: 'org1',
        source: 'slack',
        activityType: 'message',
        actorEmail: 'bob@example.com',
        timestamp: new Date(),
        metadata: { text: 'I am blocked on the API', channel: 'dev' }
    },
    {
        orgId: 'org1',
        source: 'jira',
        projectAlias: 'proj-alpha',
        activityType: 'ticket_created',
        actorEmail: 'alice@example.com',
        timestamp: new Date(),
        metadata: { title: 'Fix bug 123', status: 'Open' }
    },
    {
        orgId: 'org1',
        source: 'github',
        projectAlias: 'proj-alpha',
        activityType: 'commit',
        actorEmail: 'bob@example.com',
        timestamp: new Date(),
        metadata: { message: 'feat: add login', repo: 'backend' }
    }
];

// Mock Activity.find
Activity.find = function (query: any) {
    let results = mockActivities;
    // Simple filter simulation
    if (query.source) {
        results = results.filter(a => a.source === query.source);
    }

    // Simulate chainable Mongoose query
    return {
        lean: async () => results,
        limit: function () { return this; }, // Chainable, though we removed limit in prod code
        sort: function () { return this; }
    } as any;
} as any;

// Mock Activity.create
Activity.create = async function () { return {}; } as any;

// Spy on generateCompletion
const originalGenerateCompletion = featherless.generateCompletion;
let lastPrompt: string = "";

(featherless as any).generateCompletion = async (messages: any[]) => {
    const userMessage = messages.find(m => m.role === 'user');
    if (userMessage) {
        lastPrompt = userMessage.content;
    }
    return JSON.stringify([{
        category: 'observation',
        title: 'Test Insight',
        body: 'This is a test insight body.',
        confidence: 0.9,
        source: ['Test']
    }]);
};

async function verify() {
    console.log('--- Verifying Insights Generation with Raw Data ---');

    const startDate = new Date();
    const endDate = new Date();

    // 1. Verify HR Insights (User grouping)
    console.log('\n[HR Insights Verification]');
    lastPrompt = "";
    await generateHRInsights('org1', startDate, endDate);

    // Check if prompt contains the expected structure
    // We look for the JSON structure we built: "grouping": "BY_USER"
    if (lastPrompt.includes('"grouping": "BY_USER"') && lastPrompt.includes('alice@example.com')) {
        console.log('✅ HR Prompt contains BY_USER grouping and user data.');
    } else {
        console.error('❌ HR Prompt missing correct grouping or user data.');
        console.log('Prompt Snippet:', lastPrompt.substring(0, 500));
    }

    // 2. Verify Product Insights (Project grouping)
    console.log('\n[Product Insights Verification]');
    lastPrompt = "";
    await generateProductInsights('org1', 'proj-alpha', startDate, endDate);

    if (lastPrompt.includes('"grouping": "BY_PROJECT"') && lastPrompt.includes('proj-alpha')) {
        console.log('✅ Product Prompt contains BY_PROJECT grouping and project data.');
    } else {
        console.error('❌ Product Prompt missing correct grouping or project data.');
        console.log('Prompt Snippet:', lastPrompt.substring(0, 500));
    }

    // 3. Verify Engineering Insights (Project grouping)
    console.log('\n[Engineering Insights Verification]');
    lastPrompt = "";
    await generateEngineeringInsights('org1', 'proj-alpha', startDate, endDate);

    if (lastPrompt.includes('"grouping": "BY_PROJECT"') && lastPrompt.includes('proj-alpha')) {
        console.log('✅ Engineering Prompt contains BY_PROJECT grouping and project data.');
    } else {
        console.error('❌ Engineering Prompt missing correct grouping or project data.');
        console.log('Prompt Snippet:', lastPrompt.substring(0, 500));
    }

    console.log('\nVerification Complete.');
}

verify().catch(console.error);
