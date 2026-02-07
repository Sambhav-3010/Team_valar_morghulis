import { Request, Response } from "express";
import axios from "axios";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI!;

let accessToken = "";
let cloudId = "";

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
        const cloudResponse = await axios.get<{ id: string }[]>(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        console.log("Available Resources:", JSON.stringify(cloudResponse.data, null, 2));

        // Find the first resource that has 'jira' scopes or just pick the first one if unsure
        // For now, let's stick to index 0 but with better logging. 
        // If the user sees multiple, we can filter by name or scope.
        if (cloudResponse.data.length === 0) {
            throw new Error("No accessible resources found.");
        }
        cloudId = cloudResponse.data[0].id;
        console.log("Selected cloudId:", cloudId);
        console.log("cloudId received", cloudId);

        res.send("Jira Connected Successfully!");

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


    if (!accessToken || !cloudId) {
        res.status(401).send("Not connected to Jira. Please visit /connect first.");
        return;
    }

    try {

        const searchResponse = await axios.post<{ issues: { id: string, key: string }[] }>(
            `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql`,
            {
                jql: "created >= -30d order by created DESC",
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            }
        );

        const issueIds = searchResponse.data.issues.map(i => i.id);
        console.log(`Found ${issueIds.length} issues. Fetching details...`);

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
                            fields: "summary,status,assignee,created,resolutiondate,issuelinks"
                        }
                    }
                ).then(res => res.data).catch(err => {
                    console.error(`Failed to fetch issue ${id}:`, err.message);
                    return null;
                })
            )
        );

        const issues = detailResponses.filter(i => i !== null);

        if (issues.length > 0) {
            console.log("First detailed issue structure:", JSON.stringify(issues[0], null, 2));
        }

        const analytics = issues.map((issue: any) => {

            // Task assigned
            const assignee = issue.fields?.assignee?.displayName || "Unassigned";

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

            // Status changes
            // changelog structure might be different or missing if expand failed
            const statusChanges = issue.changelog?.histories
                ?.flatMap((h: any) => h.items)
                ?.filter((i: any) => i.field === "status") || [];

            return {
                ticket: issue.key,
                assignee,
                status,
                cycleTime,
                blocked,
                statusChanges
            };

        });

        res.json(analytics);

    } catch (error: any) {

        console.error("Fetch Error Details:", error.response?.data || error.message);
        res.status(500).send("Fetch Error");

    }

};
