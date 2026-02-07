
import mongoose, { Document, Schema } from 'mongoose';

export interface IStatusChange {
    field: string;
    fieldtype?: string;
    fieldId?: string;
    from?: string;
    fromString?: string;
    to?: string;
    toString: string;
}

export interface IComment {
    author: string;
    body: string;
    created: Date;
}

export interface IWorklog {
    author: string;
    timeSpent: string;
    timeSpentSeconds: number;
    started: Date;
}

export interface IJiraIssue extends Document {
    workspace: string;
    ticket: string;
    assignee: string;
    assigneeEmail?: string;
    assigneeAccountId?: string;
    status: string;
    cycleTime?: number;
    blocked: boolean;
    assignedAt: Date;
    statusChanges: IStatusChange[];
    priority: string;
    issueType: string;
    labels: string[];
    components: string[];
    dueDate?: Date;
    updated?: Date;
    reporter: string;
    reporterEmail?: string;
    creator: string;
    originalEstimateSeconds: number;
    remainingEstimateSeconds: number;
    timeSpentSeconds: number;
    comments: IComment[];
    worklogs: IWorklog[];
    projectLead: string;
    projectLeadEmail?: string;
    projectLeadAccountId?: string;
}

const statusChangeSchema = new Schema<IStatusChange>({
    field: { type: String, required: true },
    fieldtype: String,
    fieldId: String,
    from: String,
    fromString: String,
    to: String,
    toString: { type: String, required: true }
}, { _id: false });

const commentSchema = new Schema<IComment>({
    author: { type: String, required: true },
    body: { type: String, required: true },
    created: { type: Date, required: true }
}, { _id: false });

const worklogSchema = new Schema<IWorklog>({
    author: { type: String },
    timeSpent: String,
    timeSpentSeconds: Number,
    started: Date
}, { _id: false });

const jiraIssueSchema = new Schema<IJiraIssue>({
    workspace: { type: String, required: true },
    ticket: { type: String, required: true, unique: true }, // Using ticket key as unique identifier
    assignee: { type: String, default: "Unassigned" },
    assigneeEmail: { type: String },
    assigneeAccountId: { type: String },
    status: { type: String, default: "Unknown" },
    cycleTime: { type: Number },
    blocked: { type: Boolean, default: false },
    assignedAt: { type: Date },
    statusChanges: [statusChangeSchema],
    priority: { type: String, default: "None" },
    issueType: { type: String, default: "Unknown" },
    labels: { type: [String], default: [] },
    components: { type: [String], default: [] },
    dueDate: { type: Date },
    updated: { type: Date },
    reporter: { type: String, default: "Unknown" },
    reporterEmail: { type: String },
    creator: { type: String, default: "Unknown" },
    originalEstimateSeconds: { type: Number, default: 0 },
    remainingEstimateSeconds: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    comments: [commentSchema],
    worklogs: [worklogSchema],
    projectLead: { type: String },
    projectLeadEmail: { type: String },
    projectLeadAccountId: { type: String }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt for the record itself
});

const JiraIssue = mongoose.model<IJiraIssue>('JiraIssue', jiraIssueSchema);

export default JiraIssue;
