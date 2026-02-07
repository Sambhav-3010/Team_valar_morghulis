import { Request, Response } from "express";
import axios from "axios";
import JiraIssue from "./models/JiraIssue";
import SyncState from "./models/SyncState";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI!;

let accessToken = "";
let resources: { id: string, name: string }[] = [];

/*
==================================
1. Connect Jira (OAuth Redirect)
==================================
*/

export const connectJira = (req: Request, res: Response) => {

    const url =
        `https://auth.atlassian.com/authorize` +
        `?audience=api.atlassian.com` +
        `&client_id=${CLIENT_ID}` +
        `&scope=read:jira-work%20read:jira-user%20offline_access` +
        `&redirect_uri=${REDIRECT_URI}` +
        `&response_type=code` +
        `&prompt=consent`;

    res.redirect(url);
};

/*
==================================
2. OAuth Callback
==================================
*/

export const jiraCallback = async (req: Request, res: Response) => {

    const code = req.query.code;

    try {

        // Exchange auth code for token
        const tokenResponse = await axios.post<{ access_token: string }>(
            "https://auth.atlassian.com/oauth/token",
            {
                grant_type: "authorization_code",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                redirect_uri: REDIRECT_URI
            }
        );

        accessToken = tokenResponse.data.access_token;
        console.log("accessToken received", accessToken);

        // Get cloudid
        const cloudResponse = await axios.get<{ id: string, name: string }[]>(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        console.log("Available Resources:", JSON.stringify(cloudResponse.data, null, 2));

        if (cloudResponse.data.length === 0) {
            throw new Error("No accessible resources found.");
        }

        // Store ALL resources
        resources = cloudResponse.data;
        console.log(`Stored ${resources.length} resources.`);

        res.send("Jira Connected Successfully! You can now fetch analytics.");

    } catch (error) {

        console.error(error);
        res.send("OAuth Error");

    }

};

/*
==================================
3. Fetch Jira Analytics Data
==================================
*/

export const fetchJiraAnalytics = async (req: Request, res: Response) => {


    if (!accessToken || resources.length === 0) {
        res.status(401).send("Not connected to Jira. Please visit /connect first.");
        return;
    }

    try {
        const allAnalytics: any[] = [];

        // Loop through EACH resource (workspace)
        for (const resource of resources) {
            const cloudId = resource.id;
            const cloudName = resource.name;

            console.log(`Fetching data for workspace: ${cloudName} (${cloudId})...`);

            try {
                // Get last sync time for this resource
                const syncState = await SyncState.findOne({ resourceId: cloudId });
                let jql = "created >= -30d order by created DESC";

                if (syncState?.lastFetched) {
                    const lastFetched = new Date(syncState.lastFetched);
                    jql = `updated >= "${lastFetched.toISOString()}" order by updated ASC`;
                    console.log(`  Fetching updates since ${lastFetched.toISOString()} for ${cloudName}`);
                } else {
                    console.log(`  Fetching initial data (last 30 days) for ${cloudName}`);
                }

                // Fetch Projects
                const projectsResponse = await axios.get(
                    `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: "application/json"
                        }
                    }
                ).catch(err => {
                    console.error(`  Failed to fetch projects for ${cloudName}:`, err.message);
                    return { data: [] };
                });

                // Fetch Issues with Pagination
                let startAt = 0;
                let total = 0;
                const allIssues: any[] = [];

                do {
                    const searchResponse = await axios.post<{ issues: { id: string, key: string }[], total: number }>(
                        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql`,
                        {
                            jql,
                            startAt,
                            maxResults: 100,
                            fields: ["id", "key"] // we only need IDs first
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                Accept: "application/json",
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    const issues = searchResponse.data.issues || [];
                    allIssues.push(...issues);
                    total = searchResponse.data.total;
                    startAt += issues.length;

                    console.log(`  Fetched ${startAt}/${total} issues...`);

                } while (startAt < total);


                // Map projects to their leads
                const projectLeads: Record<string, { name: string; email: string | null; accountId: string | null }> = {};
                if (Array.isArray(projectsResponse.data)) {
                    projectsResponse.data.forEach((p: any) => {
                        projectLeads[p.id] = {
                            name: p.lead?.displayName || "Unknown",
                            email: p.lead?.emailAddress || null,
                            accountId: p.lead?.accountId || null
                        };
                        console.log(`  Project ${p.key}: Lead=${p.lead?.displayName}, Email=${p.lead?.emailAddress ? 'Found' : 'Hidden/Null'}`);
                    });
                }

                const issueIds = allIssues.map(i => i.id);
                console.log(`  Found ${issueIds.length} issues in ${cloudName}. Fetching details...`);

                // Fetch details for each issue in parallel
                const detailResponses = await Promise.all(
                    issueIds.map(id =>
                        axios.get(
                            `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${id}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    Accept: "application/json"
                                },
                                params: {
                                    expand: "changelog",
                                    fields: "summary,status,assignee,created,updated,resolutiondate,issuelinks,project,priority,issuetype,creator,reporter,duedate,labels,components,worklog,timeoriginalestimate,timeestimate,timespent,aggregateprogress,progress,comment,environment,description"
                                }
                            }
                        ).then(res => res.data).catch(err => {
                            console.error(`  Failed to fetch issue ${id} in ${cloudName}:`, err.message);
                            return null;
                        })
                    )
                );

                const issues = detailResponses.filter(i => i !== null);

                const workspaceAnalytics = issues.map((issue: any) => {

                    // Task assigned
                    const assigneeName = issue.fields?.assignee?.displayName || "Unassigned";
                    const assigneeEmail = issue.fields?.assignee?.emailAddress || null;
                    const assigneeAccountId = issue.fields?.assignee?.accountId || null;

                    // Task status
                    const status = issue.fields?.status?.name || "Unknown";

                    // Cycle time
                    const created = issue.fields?.created ? new Date(issue.fields.created) : new Date();
                    const resolved = issue.fields?.resolutiondate
                        ? new Date(issue.fields.resolutiondate)
                        : null;

                    const cycleTime =
                        resolved ? (resolved.getTime() - created.getTime()) / 1000 : null;

                    // Blocked issues
                    const blocked =
                        issue.fields?.issuelinks?.some((link: any) =>
                            link.type?.name?.toLowerCase().includes("block")
                        ) || false;

                    // Project Lead
                    const projectId = issue.fields?.project?.id;
                    const projectLead = projectLeads[projectId] || { name: "Unknown", email: null, accountId: null };

                    const statusChanges = issue.changelog?.histories
                        ?.flatMap((h: any) => h.items)
                        ?.filter((i: any) => i.field === "status") || [];

                    // New Fields Extraction
                    const priority = issue.fields?.priority?.name || "None";
                    const issueType = issue.fields?.issuetype?.name || "Unknown";
                    const labels = issue.fields?.labels || [];
                    const components = issue.fields?.components?.map((c: any) => c.name) || [];
                    const dueDate = issue.fields?.duedate ? new Date(issue.fields.duedate).toISOString() : null;
                    const updated = issue.fields?.updated ? new Date(issue.fields.updated).toISOString() : null;

                    // People
                    const reporter = issue.fields?.reporter?.displayName || "Unknown";
                    const reporterEmail = issue.fields?.reporter?.emailAddress || null;
                    const creator = issue.fields?.creator?.displayName || "Unknown";

                    // Time Tracking (in seconds)
                    const originalEstimateSeconds = issue.fields?.timeoriginalestimate || 0;
                    const remainingEstimateSeconds = issue.fields?.timeestimate || 0;
                    const timeSpentSeconds = issue.fields?.timespent || 0;

                    // Comments (Last 5 for context)
                    const comments = issue.fields?.comment?.comments?.slice(-5).map((c: any) => ({
                        author: c.author?.displayName || "Unknown",
                        body: c.body?.content?.[0]?.content?.[0]?.text || "No text content", // Simplified rich text extraction
                        created: c.created
                    })) || [];

                    // Worklogs
                    const worklogs = issue.fields?.worklog?.worklogs?.map((w: any) => ({
                        author: w.author?.displayName,
                        timeSpent: w.timeSpent,
                        timeSpentSeconds: w.timeSpentSeconds,
                        started: w.started
                    })) || [];

                    // Assignment Timestamp (When was this issue assigned to current assignee?)
                    let assignedAt = issue.fields?.created ? new Date(issue.fields.created) : new Date(); // Default to created
                    if (issue.changelog?.histories) {
                        // Sort histories by created date descending (newest first)
                        const histories = issue.changelog.histories.sort((a: any, b: any) =>
                            new Date(b.created).getTime() - new Date(a.created).getTime()
                        );

                        // Find the most recent 'assignee' change
                        for (const history of histories) {
                            const assigneeItem = history.items.find((item: any) => item.field === "assignee");
                            if (assigneeItem) {
                                // If the issue is currently assigned to someone, this was the last change event
                                // We use the history.created timestamp
                                assignedAt = new Date(history.created);
                                break;
                            }
                        }
                    }

                    return {
                        workspace: issue.fields?.project?.name || cloudName,
                        ticket: issue.key,
                        assignee: assigneeName,
                        assigneeEmail: assigneeEmail,
                        assigneeAccountId: assigneeAccountId,
                        status,
                        cycleTime,
                        blocked,
                        assignedAt: assignedAt.toISOString(), // ISO string format
                        statusChanges,

                        // New Fields
                        priority,
                        issueType,
                        labels,
                        components,
                        dueDate,
                        updated,
                        reporter,
                        reporterEmail,
                        creator,
                        originalEstimateSeconds,
                        remainingEstimateSeconds,
                        timeSpentSeconds,
                        comments,
                        worklogs,

                        projectLead: projectLead.name,
                        projectLeadEmail: projectLead.email,
                        projectLeadAccountId: projectLead.accountId
                    };

                });

                allAnalytics.push(...workspaceAnalytics);

                // Bulk upsert into MongoDB
                if (workspaceAnalytics.length > 0) {
                    const bulkOps = workspaceAnalytics.map((issue: any) => ({
                        updateOne: {
                            filter: { ticket: issue.ticket },
                            update: { $set: issue },
                            upsert: true
                        }
                    }));

                    await JiraIssue.bulkWrite(bulkOps);
                    console.log(`  Saved/Updated ${workspaceAnalytics.length} issues to MongoDB.`);

                    // Update Sync State with the latest 'updated' timestamp
                    const latestUpdate = workspaceAnalytics.reduce((max, issue) => {
                        const issueDate = issue.updated ? new Date(issue.updated).getTime() : 0;
                        return issueDate > max ? issueDate : max;
                    }, 0);

                    if (latestUpdate > 0) {
                        await SyncState.findOneAndUpdate(
                            { resourceId: cloudId },
                            {
                                resourceId: cloudId,
                                resourceName: cloudName,
                                lastFetched: new Date(latestUpdate)
                            },
                            { upsert: true, new: true }
                        );
                        console.log(`  Sync state updated to: ${new Date(latestUpdate).toISOString()}`);
                    }
                }

            } catch (err: any) {
                console.error(`Error fetching for workspace ${cloudName}:`, err.message);
                // Continue to next workspace even if one fails
            }
        }

        res.json(allAnalytics);

    } catch (error: any) {

        console.error("Fetch Error Details:", error.response?.data || error.message);
        res.status(500).send("Fetch Error");

    }

};
