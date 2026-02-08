import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Project } from '../src/models/Project';
import { Activity } from '../src/models/Activity';
import { Insight } from '../src/models/Insight';
import { Identity } from '../src/models/Identity';

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

// Define Source Models
const SlackMessageSchema = new mongoose.Schema({
    eventId: String,
    teamId: String,
    userId: String,
    userName: String,
    email: String,
    channelId: String,
    text: String,
    timestamp: Number,
    threadTs: Number,
    createdAt: Date
});
const SlackMessage = mongoose.models.SlackMessage || mongoose.model('SlackMessage', SlackMessageSchema);

const WebhookEventSchema = new mongoose.Schema({
    eventType: String,
    eventAction: String,
    installationId: Number,
    repositoryId: Number,
    repositoryFullName: String,
    senderLogin: String,
    payload: mongoose.Schema.Types.Mixed,
    createdAt: Date
});
const WebhookEvent = mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', WebhookEventSchema);

const JiraIssueSchema = new mongoose.Schema({
    workspace: String,
    ticket: String,
    assigneeEmail: String,
    status: String,
    statusChanges: [new mongoose.Schema({ fromString: String, toString: String }, { _id: false })],
    issueType: String,
    priority: String,
    labels: [String],
    components: [String],
    updatedAt: Date,
    reporterEmail: String,
    createdAt: Date
});
const JiraIssue = mongoose.models.JiraIssue || mongoose.model('JiraIssue', JiraIssueSchema);

const EmailMetadataSchema = new mongoose.Schema({
    orgId: String,
    userEmail: String,
    messageId: String,
    sender: String,
    subject: String,
    body: String,
    timestamp: Number,
    createdAt: Date
});
const EmailMetadata = mongoose.models.EmailMetadata || mongoose.model('EmailMetadata', EmailMetadataSchema);

const TransformStateSchema = new mongoose.Schema({
    source: { type: String, required: true, unique: true },
    lastRunAt: { type: Date },
    lastSuccessAt: { type: Date },
    lastError: { type: String },
    isRunning: { type: Boolean, default: false }
}, { timestamps: true });
const TransformState = mongoose.models.TransformState || mongoose.model('TransformState', TransformStateSchema);

// Helper to generate random date within last 30 days
const getRandomDate = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Seed Data
const seed = async () => {
    try {
        console.log('Starting seed process...');
        await connectDB();

        console.log('Clearing old data...');
        // Clear everything
        await Project.deleteMany({});
        console.log('Cleared Projects');
        await Activity.deleteMany({});
        console.log('Cleared Activities');
        await Insight.deleteMany({});
        console.log('Cleared Insights');
        await Identity.deleteMany({});
        console.log('Cleared Identities');
        await SlackMessage.deleteMany({});
        console.log('Cleared SlackMessages');
        await WebhookEvent.deleteMany({});
        console.log('Cleared WebhookEvents');
        await JiraIssue.deleteMany({});
        console.log('Cleared JiraIssues');
        await EmailMetadata.deleteMany({});
        console.log('Cleared EmailMetadata');
        await TransformState.deleteMany({});
        console.log('Cleared TransformState');

        console.log('Seeding Identities...');
        const orgId = 'acme-corp';

        await Identity.create([
            {
                orgId,
                primaryEmail: 'alice@acme.com',
                displayName: 'Alice Engineer',
                githubLogin: 'alice-dev',
                slackUserId: 'U_ALICE',
                defaultProjectId: 'proj-alpha'
            },
            {
                orgId,
                primaryEmail: 'bob@acme.com',
                displayName: 'Bob Manager',
                jiraAccountId: 'ACC_BOB',
                defaultProjectId: 'proj-alpha'
            },
            {
                orgId,
                primaryEmail: 'charlie@acme.com',
                displayName: 'Charlie Dev',
                githubLogin: 'charlie-dev',
                slackUserId: 'U_CHARLIE',
                defaultProjectId: 'proj-beta'
            }
        ]);
        console.log('Identities seeded');

        console.log('Seeding Projects...');
        await Project.create({
            projectId: 'proj-alpha',
            name: 'Project Alpha',
            orgId,
            description: 'Main flagship product',
            aliases: {
                github: ['acme-corp/alpha-repo'],
                slack: ['C101'],
                jira: ['ALPHA'],
                email: ['alpha']
            }
        });

        await Project.create({
            projectId: 'proj-beta',
            name: 'Project Beta',
            orgId,
            description: 'Next-gen backend system',
            aliases: {
                github: ['acme-corp/beta-backend'],
                slack: ['C102'],
                jira: ['BETA'],
                email: ['beta']
            }
        });
        console.log('Projects seeded');

        console.log('Seeding Slack Messages (50 items)...');
        const slackMessages = [];
        for (let i = 0; i < 50; i++) {
            const isAlpha = i % 2 === 0;
            const channelId = isAlpha ? 'C101' : 'C102';
            const date = getRandomDate();

            slackMessages.push({
                eventId: `evt_${i}`,
                teamId: orgId, // Using acme-corp to match user's teamId usage
                email: isAlpha ? 'alice@acme.com' : 'charlie@acme.com',
                channelId: channelId,
                text: `Update on ${isAlpha ? 'Alpha' : 'Beta'} feature #${i}. We are making progress!`,
                timestamp: Math.floor(date.getTime() / 1000),
                userId: isAlpha ? 'U_ALICE' : 'U_CHARLIE',
                userName: isAlpha ? 'alice' : 'charlie',
                createdAt: date
            });
        }
        await SlackMessage.insertMany(slackMessages);
        console.log('Slack Messages seeded');

        console.log('Seeding GitHub Events (50 items)...');
        const githubEvents = [];
        for (let i = 0; i < 50; i++) {
            const isAlpha = i % 2 === 0;
            const repo = isAlpha ? 'acme-corp/alpha-repo' : 'acme-corp/beta-backend';
            const date = getRandomDate();
            const type = i % 3 === 0 ? 'pull_request' : 'push';

            if (type === 'push') {
                githubEvents.push({
                    eventType: 'push',
                    repositoryFullName: repo,
                    senderLogin: isAlpha ? 'alice-dev' : 'charlie-dev',
                    payload: {
                        ref: 'refs/heads/main',
                        commits: [{ message: `feat: update ${i}` }]
                    },
                    createdAt: date
                });
            } else {
                githubEvents.push({
                    eventType: 'pull_request',
                    eventAction: 'opened',
                    repositoryFullName: repo,
                    senderLogin: isAlpha ? 'alice-dev' : 'charlie-dev',
                    payload: {
                        pull_request: {
                            number: i,
                            title: `feat: feature ${i}`,
                            state: 'open'
                        }
                    },
                    createdAt: date
                });
            }
        }
        await WebhookEvent.insertMany(githubEvents);
        console.log('GitHub Events seeded');

        console.log('Seeding Jira Issues (50 items)...');
        const jiraIssues = [];
        for (let i = 0; i < 50; i++) {
            const isAlpha = i % 2 === 0;
            const projectKey = isAlpha ? 'ALPHA' : 'BETA';
            const date = getRandomDate();

            jiraIssues.push({
                workspace: orgId, // Using acme-corp to match transformer orgId logic
                ticket: `${projectKey}-${i + 100}`,
                assigneeEmail: isAlpha ? 'alice@acme.com' : 'charlie@acme.com',
                status: i % 3 === 0 ? 'Done' : 'In Progress',
                issueType: i % 4 === 0 ? 'Bug' : 'Story',
                priority: i % 5 === 0 ? 'High' : 'Medium',
                reporterEmail: 'bob@acme.com',
                statusChanges: i % 3 === 0 ? [{ fromString: 'In Progress', toString: 'Done' }] : [],
                createdAt: date,
                updatedAt: date
            });
        }
        await JiraIssue.insertMany(jiraIssues);
        console.log('Jira Issues seeded');

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('SEEDING FAILED:', err);
        process.exit(1);
    }
};

seed();
