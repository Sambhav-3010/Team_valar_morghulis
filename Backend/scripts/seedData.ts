import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Project } from '../src/models/Project';
import { Activity } from '../src/models/Activity';
import { Insight } from '../src/models/Insight';

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

// Define Source Models (copied from transformers)
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

// Seed Data
const seed = async () => {
    await connectDB();

    console.log('Clearing old test data...');
    // Clear TransformState to ensure transformers run from scratch
    await TransformState.deleteMany({});
    console.log('Cleared TransformState.');

    // Clear existing data
    console.log('Clearing projects and source data...');
    await Project.deleteMany({});
    await Activity.deleteMany({});
    await SlackMessage.deleteMany({});
    await WebhookEvent.deleteMany({});
    await JiraIssue.deleteMany({});
    await EmailMetadata.deleteMany({});

    console.log('Seeding Projects...');
    const orgId = 'valar-morghulis';

    // Project Phoenix
    await Project.create({
        projectId: 'proj_phoenix',
        name: 'Project Phoenix',
        orgId,
        description: 'A revolutionary new AI platform',
        aliases: {
            github: ['org/project-phoenix'],
            slack: ['channel_phoenix'],
            jira: ['PHOENIX'],
            email: ['project phoenix']
        }
    });

    // Project Orion
    await Project.create({
        projectId: 'proj_orion',
        name: 'Project Orion',
        orgId,
        description: 'Next-gen satellite tracking system',
        aliases: {
            github: ['org/project-orion'],
            slack: ['channel_orion'],
            jira: ['ORION'],
            email: ['project orion']
        }
    });

    console.log('Seeding Slack Messages...');
    await SlackMessage.create([
        {
            eventId: 'evt_phx_1',
            teamId: orgId,
            email: 'alice@valar.com',
            channelId: 'channel_phoenix',
            text: 'Hey team, the new API endpoints for Phoenix are ready for review.',
            timestamp: Date.now() / 1000,
            createdAt: new Date()
        },
        {
            eventId: 'evt_phx_2',
            teamId: orgId,
            email: 'bob@valar.com',
            channelId: 'channel_phoenix',
            text: 'Great! I will take a look this afternoon. Are the docs updated?',
            timestamp: Date.now() / 1000 + 60,
            createdAt: new Date()
        },
        {
            eventId: 'evt_orion_1',
            teamId: orgId,
            email: 'charlie@valar.com',
            channelId: 'channel_orion',
            text: 'Orion satellite link is unstable. We need to investigate the signal logs.',
            timestamp: Date.now() / 1000,
            createdAt: new Date()
        }
    ]);

    console.log('Seeding GitHub Events...');
    await WebhookEvent.create([
        {
            eventType: 'push',
            repositoryFullName: 'org/project-phoenix',
            senderLogin: 'alice_dev',
            payload: {
                ref: 'refs/heads/main',
                commits: [{ message: 'feat: add new phoenix endpoints' }]
            },
            createdAt: new Date()
        },
        {
            eventType: 'pull_request',
            eventAction: 'opened',
            repositoryFullName: 'org/project-orion',
            senderLogin: 'charlie_dev',
            payload: {
                pull_request: {
                    number: 42,
                    title: 'fix: stabilize signal processing',
                    state: 'open'
                }
            },
            createdAt: new Date()
        }
    ]);

    console.log('Seeding Jira Issues...');
    await JiraIssue.create([
        {
            workspace: 'PHOENIX',
            ticket: 'PHOENIX-101',
            assigneeEmail: 'alice@valar.com',
            status: 'In Progress',
            issueType: 'Story',
            reporterEmail: 'manager@valar.com',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            workspace: 'ORION',
            ticket: 'ORION-55',
            assigneeEmail: 'charlie@valar.com',
            status: 'Done',
            statusChanges: [{ fromString: 'In Progress', toString: 'Done' }],
            issueType: 'Bug',
            reporterEmail: 'director@valar.com',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);

    console.log('Seeding Emails...');
    await EmailMetadata.create([
        {
            orgId,
            userEmail: 'manager@valar.com',
            messageId: 'msg_123',
            subject: 'Project Phoenix Timeline Update',
            body: 'We are on track for the Q3 release of Phoenix. Keep up the good work!',
            timestamp: Date.now(),
            createdAt: new Date()
        },
        {
            orgId,
            userEmail: 'director@valar.com',
            messageId: 'msg_456',
            subject: 'Urgent: Project Orion Budget',
            body: 'We need to discuss the hardware budget for Orion next week.',
            timestamp: Date.now(),
            createdAt: new Date()
        }
    ]);

    console.log('Seeding complete!');
    process.exit(0);
};

seed();
