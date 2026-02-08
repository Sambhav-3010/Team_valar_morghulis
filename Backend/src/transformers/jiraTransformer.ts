import mongoose from 'mongoose';
import { Activity, IActivity } from '../models';

// Import JiraIssue model schema (we connect to the same DB)
const StatusChangeSchema = new mongoose.Schema({
    field: String,
    fieldtype: String,
    fieldId: String,
    from: String,
    fromString: String,
    to: String,
    toString: String
}, { _id: false });

const CommentSchema = new mongoose.Schema({
    author: String,
    body: String,
    created: Date
}, { _id: false });

const WorklogSchema = new mongoose.Schema({
    author: String,
    timeSpent: String,
    timeSpentSeconds: Number,
    started: Date
}, { _id: false });

const JiraIssueSchema = new mongoose.Schema({
    workspace: String,
    ticket: String,
    assignee: String,
    assigneeEmail: String,
    assigneeAccountId: String,
    status: String,
    cycleTime: Number,
    blocked: Boolean,
    assignedAt: Date,
    statusChanges: [StatusChangeSchema],
    priority: String,
    issueType: String,
    labels: [String],
    components: [String],
    dueDate: Date,
    updated: Date,
    reporter: String,
    reporterEmail: String,
    creator: String,
    originalEstimateSeconds: Number,
    remainingEstimateSeconds: Number,
    timeSpentSeconds: Number,
    comments: [CommentSchema],
    worklogs: [WorklogSchema],
    projectLead: String,
    projectLeadEmail: String,
    projectLeadAccountId: String,
    createdAt: Date,
    updatedAt: Date
});

// Get or create the model
const JiraIssue = mongoose.models.JiraIssue ||
    mongoose.model('JiraIssue', JiraIssueSchema);

export interface TransformResult {
    processed: number;
    created: number;
    skipped: number;
    errors: number;
}

/**
 * Transform JiraIssue records into Activity records
 * Each issue generates multiple activities:
 * - ticket_created (when the issue was created)
 * - status_change (for each status transition)
 * - ticket_updated (for assignment changes, worklogs)
 * 
 * @param since - Only process issues updated after this date
 * @param workspace - Optional workspace filter
 */
export async function transformJiraIssues(
    since?: Date,
    workspace?: string
): Promise<TransformResult> {
    const result: TransformResult = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0
    };

    try {
        // Build query
        const query: Record<string, any> = {};
        if (since) {
            query.updatedAt = { $gte: since };
        }
        if (workspace) {
            query.workspace = workspace;
        }

        // Fetch Jira issues
        const issues = await JiraIssue.find(query).lean();
        result.processed = issues.length;

        for (const issue of issues) {
            try {
                // 1. Create ticket_created activity
                const createdRefId = `jira:${issue.ticket}:created`;
                const existingCreated = await Activity.findOne({
                    source: 'jira',
                    sourceRefId: createdRefId
                });

                if (!existingCreated && issue.reporterEmail) {
                    const createdActivity: Partial<IActivity> = {
                        orgId: issue.workspace || 'default',
                        source: 'jira',
                        activityType: 'ticket_created',
                        actorEmail: issue.reporterEmail,
                        projectAlias: issue.workspace || 'unknown',
                        timestamp: issue.createdAt || issue.assignedAt || new Date(),
                        sourceRefId: createdRefId,
                        metadata: {
                            ticket: issue.ticket,
                            issueType: issue.issueType,
                            priority: issue.priority,
                            labels: issue.labels,
                            components: issue.components
                        }
                    };
                    await Activity.create(createdActivity);
                    result.created++;
                } else if (existingCreated) {
                    result.skipped++;
                }

                // 2. Create status_change activities
                if (issue.statusChanges && Array.isArray(issue.statusChanges)) {
                    for (let i = 0; i < issue.statusChanges.length; i++) {
                        const change = issue.statusChanges[i];
                        const changeRefId = `jira:${issue.ticket}:status:${i}`;

                        const existingChange = await Activity.findOne({
                            source: 'jira',
                            sourceRefId: changeRefId
                        });

                        if (!existingChange) {
                            // Use assignee email or reporter email as actor
                            const actorEmail = issue.assigneeEmail || issue.reporterEmail;
                            if (actorEmail) {
                                const statusActivity: Partial<IActivity> = {
                                    orgId: issue.workspace || 'default',
                                    source: 'jira',
                                    activityType: 'status_change',
                                    actorEmail: actorEmail,
                                    projectAlias: issue.workspace || 'unknown',
                                    timestamp: issue.updatedAt || new Date(),
                                    sourceRefId: changeRefId,
                                    metadata: {
                                        ticket: issue.ticket,
                                        fromStatus: change.fromString,
                                        toStatus: change.toString,
                                        issueType: issue.issueType
                                    }
                                };
                                await Activity.create(statusActivity);
                                result.created++;
                            }
                        } else {
                            result.skipped++;
                        }
                    }
                }

                // 3. Create ticket_updated for worklogs
                if (issue.worklogs && Array.isArray(issue.worklogs)) {
                    for (let i = 0; i < issue.worklogs.length; i++) {
                        const worklog = issue.worklogs[i];
                        const worklogRefId = `jira:${issue.ticket}:worklog:${i}`;

                        const existingWorklog = await Activity.findOne({
                            source: 'jira',
                            sourceRefId: worklogRefId
                        });

                        if (!existingWorklog && worklog.author) {
                            // Try to find email from assignee if author matches
                            let actorEmail = issue.assigneeEmail;
                            if (worklog.author === issue.reporter && issue.reporterEmail) {
                                actorEmail = issue.reporterEmail;
                            }

                            if (actorEmail) {
                                const worklogActivity: Partial<IActivity> = {
                                    orgId: issue.workspace || 'default',
                                    source: 'jira',
                                    activityType: 'ticket_updated',
                                    actorEmail: actorEmail,
                                    projectAlias: issue.workspace || 'unknown',
                                    timestamp: worklog.started || issue.updatedAt || new Date(),
                                    sourceRefId: worklogRefId,
                                    metadata: {
                                        ticket: issue.ticket,
                                        updateType: 'worklog',
                                        timeSpent: worklog.timeSpent,
                                        timeSpentSeconds: worklog.timeSpentSeconds
                                    }
                                };
                                await Activity.create(worklogActivity);
                                result.created++;
                            }
                        } else if (existingWorklog) {
                            result.skipped++;
                        }
                    }
                }
            } catch (err) {
                console.error(`Error transforming Jira issue ${issue.ticket}:`, err);
                result.errors++;
            }
        }
    } catch (err) {
        console.error('Error in Jira transformation:', err);
        throw err;
    }

    return result;
}

export default { transformJiraIssues };
