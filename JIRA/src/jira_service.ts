import { Request, Response } from "express";
import axios from "axios";
import cron from "node-cron";
import JiraIssue from "./models/JiraIssue";
import SyncState from "./models/SyncState";
import JiraAuth from "./models/JiraAuth";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI!;

// Keep track of sync status to avoid overlapping jobs
let isSyncing = false;

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
        `&scope=read:jira-work%20read:jira-user%20offline_access` + // added offline_access
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
        const tokenResponse = await axios.post<{ access_token: string, refresh_token?: string, scope?: string, expires_in?: number }>(
            "https://auth.atlassian.com/oauth/token",
            {
                grant_type: "authorization_code",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                redirect_uri: REDIRECT_URI
            }
        );

        const { access_token, refresh_token, scope, expires_in } = tokenResponse.data;

        console.log("Tokens received. Saving to DB...");

        // Store tokens in DB (Upsert - assuming single user/org for now)
        await JiraAuth.findOneAndUpdate({}, {
            accessToken: access_token,
            refreshToken: refresh_token || "",
            scope: scope || "",
            expiresIn: expires_in || 3600
        }, { upsert: true, new: true });

        // Initial Sync Trigger
        runJiraSync().catch(console.error);

        res.send("Jira Connected Successfully! Data sync started in background.");

    } catch (error) {

        console.error(error);
        res.send("OAuth Error");

    }

};

/*
==================================
3. Token Refresh Mechanism
==================================
*/

const getValidAccessToken = async (): Promise<string | null> => {
    try {
        const auth = await JiraAuth.findOne();
        if (!auth) return null;

        // Simple check: In a real app we might check expiration time explicitly.
        // For now, let's just return the token if we have it, 
        // OR proactive refresh if we added 'expiresAt' field.
        // But since we can catch 401s, we can also refresh on demand.
        // Let's implement proactive refresh if we want, or just return existing.
        // Better: Try to use it, catch 401, then refresh? 
        // Or refresh if older than 50 minutes? 
        // Let's implement explicit refresh call if 401 happens in the sync function.
        // For now, return what we have.
        return auth.accessToken;
    } catch (err) {
        console.error("Error retrieving token:", err);
        return null;
    }
};

const refreshAccessToken = async (): Promise<string | null> => {
    try {
        const auth = await JiraAuth.findOne();
        if (!auth || !auth.refreshToken) {
            console.error("No refresh token available.");
            return null;
        }

        console.log("Refreshing access token...");
        const response = await axios.post<{ access_token: string, refresh_token?: string }>(
            "https://auth.atlassian.com/oauth/token",
            {
                grant_type: "refresh_token",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: auth.refreshToken
            }
        );

        const { access_token, refresh_token } = response.data;

        await JiraAuth.updateOne({}, {
            accessToken: access_token,
            refreshToken: refresh_token || auth.refreshToken // Rotate if provided
        });

        console.log("Token refreshed successfully.");
        return access_token;

    } catch (error: any) {
        console.error("Failed to refresh token:", error.response?.data || error.message);
        return null;
    }
};

/*
==================================
4. Core Sync Logic
==================================
*/

export const runJiraSync = async () => {
    if (isSyncing) {
        console.log("Sync already in progress. Skipping.");
        return [];
    }

    isSyncing = true;
    const allAnalytics: any[] = [];

    try {
        let accessToken = await getValidAccessToken();

        if (!accessToken) {
            console.log("No access token found. Please connect Jira first.");
            isSyncing = false;
            return [];
        }

        // Fetch Accessible Resources (Workspaces)
        // If 401, try refreshing token once
        let cloudResponse;
        try {
            cloudResponse = await axios.get<{ id: string, name: string }[]>(
                "https://api.atlassian.com/oauth/token/accessible-resources",
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (err: any) {
            if (err.response?.status === 401) {
                console.log("Token expired during resource fetch. Refreshing...");
                accessToken = await refreshAccessToken();
                if (accessToken) {
                    cloudResponse = await axios.get<{ id: string, name: string }[]>(
                        "https://api.atlassian.com/oauth/token/accessible-resources",
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                } else {
                    throw new Error("Failed to refresh token.");
                }
            } else {
                throw err;
            }
        }

        const resources = cloudResponse.data;
        console.log(`Found ${resources.length} accessible resources.`);

        if (resources.length === 0) {
            console.log("No changes or resources found.");
            isSyncing = false;
            return [];
        }

        // Loop through EACH resource (workspace)
        for (const resource of resources) {
            const cloudId = resource.id;
            const cloudName = resource.name;

            console.log(`Fetching data for workspace: ${cloudName} (${cloudId})...`);

            try {
                // Get last sync time
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
                const MAX_RESULTS = 100;

                do {
                    const searchResponse = await axios.post<{ issues: { id: string, key: string }[], total: number }>(
                        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql`,
                        {
                            jql,
                            startAt,
                            maxResults: MAX_RESULTS,
                            fields: ["id", "key"]
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

                if (allIssues.length === 0) {
                    console.log(`  No new/updated issues for ${cloudName}.`);
                    continue;
                }

                // Map projects to leads
                const projectLeads: Record<string, { name: string; email: string | null; accountId: string | null }> = {};
                if (Array.isArray(projectsResponse.data)) {
                    projectsResponse.data.forEach((p: any) => {
                        projectLeads[p.id] = {
                            name: p.lead?.displayName || "Unknown",
                            email: p.lead?.emailAddress || null,
                            accountId: p.lead?.accountId || null
                        };
                    });
                }

                const issueIds = allIssues.map(i => i.id);
                console.log(`  Processing ${issueIds.length} issues...`);

                // Fetch details for each issue
                const detailResponses = await Promise.all(
                    issueIds.map(async (id) => {
                        try {
                            const res = await axios.get(
                                `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${id}`,
                                {
                                    headers: { Authorization: `Bearer ${accessToken}` },
                                    params: {
                                        expand: "changelog",
                                        fields: "summary,status,assignee,created,updated,resolutiondate,issuelinks,project,priority,issuetype,creator,reporter,duedate,labels,components,worklog,timeoriginalestimate,timeestimate,timespent,aggregateprogress,progress,comment,environment,description"
                                    }
                                }
                            );
                            return res.data;
                        } catch (err: any) {
                            console.error(`  Failed to fetch issue ${id} in ${cloudName}:`, err.message);
                            return null;
                        }
                    })
                );

                const issues = detailResponses.filter(i => i !== null);

                // Transform Data
                const workspaceAnalytics = issues.map((issue: any) => {
                    // Helper for nested fields
                    const fields = issue.fields || {};

                    // Task assigned
                    const assigneeName = fields.assignee?.displayName || "Unassigned";
                    const assigneeEmail = fields.assignee?.emailAddress || null;
                    const assigneeAccountId = fields.assignee?.accountId || null;

                    // Task status
                    const status = fields.status?.name || "Unknown";

                    // Cycle time
                    const created = fields.created ? new Date(fields.created) : new Date();
                    const resolved = fields.resolutiondate ? new Date(fields.resolutiondate) : null;
                    const cycleTime = resolved ? (resolved.getTime() - created.getTime()) / 1000 : null;

                    // Blocked issues
                    const blocked = fields.issuelinks?.some((link: any) =>
                        link.type?.name?.toLowerCase().includes("block")
                    ) || false;

                    // Project Lead
                    const projectId = fields.project?.id;
                    const projectLead = projectLeads[projectId] || { name: "Unknown", email: null, accountId: null };

                    const statusChanges = issue.changelog?.histories
                        ?.flatMap((h: any) => h.items)
                        ?.filter((i: any) => i.field === "status") || [];

                    // Comments
                    const comments = fields.comment?.comments?.slice(-5).map((c: any) => ({
                        author: c.author?.displayName || "Unknown",
                        body: c.body?.content?.[0]?.content?.[0]?.text || "No text content",
                        created: c.created
                    })) || [];

                    // Worklogs
                    const worklogs = fields.worklog?.worklogs?.map((w: any) => ({
                        author: w.author?.displayName,
                        timeSpent: w.timeSpent,
                        timeSpentSeconds: w.timeSpentSeconds,
                        started: w.started
                    })) || [];

                    // Assignment Timestamp
                    let assignedAt = created;
                    if (issue.changelog?.histories) {
                        const histories = issue.changelog.histories.sort((a: any, b: any) =>
                            new Date(b.created).getTime() - new Date(a.created).getTime()
                        );
                        for (const history of histories) {
                            const assigneeItem = history.items.find((item: any) => item.field === "assignee");
                            if (assigneeItem) {
                                assignedAt = new Date(history.created);
                                break;
                            }
                        }
                    }

                    return {
                        workspace: fields.project?.name || cloudName,
                        ticket: issue.key,
                        assignee: assigneeName,
                        assigneeEmail,
                        assigneeAccountId,
                        status,
                        cycleTime,
                        blocked,
                        assignedAt: assignedAt.toISOString(),
                        statusChanges,
                        priority: fields.priority?.name || "None",
                        issueType: fields.issuetype?.name || "Unknown",
                        labels: fields.labels || [],
                        components: fields.components?.map((c: any) => c.name) || [],
                        dueDate: fields.duedate ? new Date(fields.duedate).toISOString() : null,
                        updated: fields.updated ? new Date(fields.updated).toISOString() : null,
                        reporter: fields.reporter?.displayName || "Unknown",
                        reporterEmail: fields.reporter?.emailAddress || null,
                        creator: fields.creator?.displayName || "Unknown",
                        originalEstimateSeconds: fields.timeoriginalestimate || 0,
                        remainingEstimateSeconds: fields.timeestimate || 0,
                        timeSpentSeconds: fields.timespent || 0,
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
                    console.log(`  Saved/Updated ${workspaceAnalytics.length} issues for ${cloudName}.`);

                    // Update Sync State
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
            }
        } // End for resources

    } catch (error: any) {
        console.error("Critical Sync Error:", error.message);
    } finally {
        isSyncing = false;
    }

    return allAnalytics;
};

/*
==================================
5. Fetch Handler (for manual trigger)
==================================
*/

export const fetchJiraAnalytics = async (req: Request, res: Response) => {
    // If request comes from frontend, force a sync call
    try {
        const data = await runJiraSync();
        res.json(data);
    } catch (error) {
        res.status(500).send("Error fetching data");
    }
};

/*
==================================
6. Cron Job
==================================
*/

// Schedule task to run every 8 hours
cron.schedule('0 */8 * * *', () => {
    console.log('Running Jira Analytics Sync Job...');
    runJiraSync();
});
