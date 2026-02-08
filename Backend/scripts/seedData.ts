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

// Define Source Models with complete schemas
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
    senderId: Number,
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
    receiver: [String],
    subject: String,
    body: String,
    timestamp: Number,
    threadId: String,
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

// User Generation Helpers
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const generateUsers = (count: number) => {
    const users = [];
    const usedEmails = new Set<string>();

    const coreUsers = [
        {
            displayName: 'Alice Engineer',
            first: 'Alice', last: 'Engineer',
            email: 'alice@acme.com',
            github: 'alice-dev',
            slack: 'U_ALICE',
            jira: 'ACC_ALICE',
            project: 'proj-alpha'
        },
        {
            displayName: 'Bob Manager',
            first: 'Bob', last: 'Manager',
            email: 'bob@acme.com',
            github: 'bob-mgr',
            slack: 'U_BOB',
            jira: 'ACC_BOB',
            project: 'proj-alpha'
        },
        {
            displayName: 'Charlie Dev',
            first: 'Charlie', last: 'Dev',
            email: 'charlie@acme.com',
            github: 'charlie-dev',
            slack: 'U_CHARLIE',
            jira: 'ACC_CHARLIE',
            project: 'proj-beta'
        }
    ];

    for (const u of coreUsers) {
        users.push(u);
        usedEmails.add(u.email);
    }

    let attempts = 0;
    while (users.length < count + 3 && attempts < 1000) {
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const last = lastNames[Math.floor(Math.random() * lastNames.length)];
        const email = `${first.toLowerCase()}.${last.toLowerCase()}@acme.com`;

        if (!usedEmails.has(email)) {
            usedEmails.add(email);
            const project = Math.random() > 0.5 ? 'proj-alpha' : 'proj-beta';
            users.push({
                displayName: `${first} ${last}`,
                first, last,
                email,
                github: `${first.toLowerCase()}-${last.toLowerCase()}`,
                slack: `U_${first.toUpperCase()}_${last.toUpperCase()}`,
                jira: `ACC_${first.toUpperCase()}`,
                project
            });
        }
        attempts++;
    }
    return users;
};

// Seed Data
const seed = async () => {
    try {
        console.log('Starting seed process...');
        await connectDB();

        console.log('Clearing old data...');
        // Clear everything
        await Project.deleteMany({});
        await Activity.deleteMany({});
        await Insight.deleteMany({});
        await Identity.deleteMany({});
        await SlackMessage.deleteMany({});
        await WebhookEvent.deleteMany({});
        await JiraIssue.deleteMany({});
        await EmailMetadata.deleteMany({});
        await TransformState.deleteMany({});
        console.log('Data cleared.');

        const orgId = 'acme-corp';
        const users = generateUsers(25); // Target ~28 users

        console.log(`Seeding ${users.length} Identities...`);
        await Identity.insertMany(users.map(u => ({
            orgId,
            primaryEmail: u.email,
            displayName: u.displayName,
            githubLogin: u.github,
            slackUserId: u.slack,
            jiraAccountId: u.jira,
            defaultProjectId: u.project
        })));
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

        console.log('Seeding Slack Messages (70 items)...');
        const slackMessages = [];
        for (let i = 0; i < 70; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const channelId = user.project === 'proj-alpha' ? 'C101' : 'C102';
            const date = getRandomDate();

            slackMessages.push({
                eventId: `evt_${i}`,
                teamId: orgId,
                email: user.email,
                channelId: channelId,
                text: `Update on feature #${i}. Making progress on ${user.project}.`,
                timestamp: Math.floor(date.getTime() / 1000),
                userId: user.slack,
                userName: user.first.toLowerCase(),
                createdAt: date
            });
        }
        await SlackMessage.insertMany(slackMessages);
        console.log('Slack Messages seeded');

        console.log('Seeding GitHub Events (80 items)...');
        const githubEvents = [];
        for (let i = 0; i < 80; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const repo = user.project === 'proj-alpha' ? 'acme-corp/alpha-repo' : 'acme-corp/beta-backend';
            const date = getRandomDate();

            const rand = Math.random();
            let type = 'push';
            let action = undefined;
            let payload: any = {};

            if (rand < 0.5) {
                type = 'push';
                payload = { ref: 'refs/heads/main', commits: [{ message: `feat: update ${i} by ${user.first}` }] };
            } else if (rand < 0.7) {
                type = 'pull_request';
                action = 'opened';
                payload = { pull_request: { number: i, title: `feat: feature ${i}`, state: 'open' } };
            } else if (rand < 0.8) {
                type = 'pull_request_review';
                action = 'submitted';
                payload = { pull_request: { number: i }, review: { state: 'approved' } };
            } else {
                type = 'deployment';
                action = 'created';
                payload = { deployment: { environment: 'production' }, deployment_status: { state: 'success' } };
            }

            githubEvents.push({
                eventType: type,
                eventAction: action,
                repositoryFullName: repo,
                senderLogin: user.github,
                senderId: Math.floor(Math.random() * 10000),
                payload,
                createdAt: date
            });
        }
        await WebhookEvent.insertMany(githubEvents);
        console.log('GitHub Events seeded');

        console.log('Seeding Jira Issues (70 items)...');
        const jiraIssues = [];
        for (let i = 0; i < 70; i++) {
            const assignee = users[Math.floor(Math.random() * users.length)];
            const reporter = users[Math.floor(Math.random() * users.length)];
            const projectKey = assignee.project === 'proj-alpha' ? 'ALPHA' : 'BETA';
            const date = getRandomDate();

            jiraIssues.push({
                workspace: orgId,
                ticket: `${projectKey}-${i + 100}`,
                assigneeEmail: assignee.email,
                status: Math.random() > 0.5 ? 'Done' : 'In Progress',
                issueType: Math.random() > 0.8 ? 'Bug' : 'Story',
                priority: Math.random() > 0.7 ? 'High' : 'Medium',
                reporterEmail: reporter.email,
                statusChanges: Math.random() > 0.5 ? [{ fromString: 'In Progress', toString: 'Done' }] : [],
                createdAt: date,
                updatedAt: date
            });
        }
        await JiraIssue.insertMany(jiraIssues);
        console.log('Jira Issues seeded');

        console.log('Seeding Email Metadata (50 items)...');
        const emails = [];
        for (let i = 0; i < 50; i++) {
            const sender = users[Math.floor(Math.random() * users.length)];
            const receiver = users[Math.floor(Math.random() * users.length)];
            const date = getRandomDate();
            const projectAlias = sender.project === 'proj-alpha' ? 'Alpha' : 'Beta';

            emails.push({
                orgId,
                userEmail: sender.email, // "Sent" box
                messageId: `msg_${i}`,
                sender: sender.email,
                receiver: [receiver.email],
                subject: `[${projectAlias}] Discussion about task ${i}`,
                body: `Hello ${receiver.first}, let's discuss the task ${i}. Regards, ${sender.first}.`,
                timestamp: date.getTime(),
                threadId: `thread_${i}`,
                createdAt: date
            });
        }
        await EmailMetadata.insertMany(emails);
        console.log('Email Metadata seeded');

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('SEEDING FAILED:', err);
        process.exit(1);
    }
};

seed();
