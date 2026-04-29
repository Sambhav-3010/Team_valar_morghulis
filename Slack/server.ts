import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import mongoose from "mongoose";
import axios from "axios";
import { SlackMessage, SlackAuth, IMention, IAttachment } from "./models";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MONGODB_URI = process.env.MONGODB_URI as string;
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// Cache for Slack WebClient instances to avoid repeated lookups
const clientCache: Record<string, any> = {};

async function getClientForTeam(teamId: string): Promise<any> {
    if (clientCache[teamId]) return clientCache[teamId];

    const auth = await SlackAuth.findOne({ teamId });
    if (!auth) return null;

    const client = new WebClient(auth.accessToken);
    clientCache[teamId] = client;
    return client;
}

async function resolveMention(slack: any, id: string): Promise<IMention | null> {
    try {
        const info = await slack.users.info({ user: id });
        if (!info.ok || !info.user) return null;

        return {
            id: id,
            name: info.user.real_name || info.user.name || "Unknown",
            email: info.user.profile?.email || "No Email",
            type: info.user.is_bot ? 'bot' : 'user'
        };
    } catch (error: any) {
        if (error?.data?.error === 'user_not_found') {
            return {
                id: id,
                name: "Unknown User",
                email: "None",
                type: 'user'
            };
        }
        console.error(`Error resolving mention ${id}:`, error);
        return null;
    }
}

async function processEvent(event: any, teamId: string) {
    if (event.type !== "message" || event.bot_id) return;

    if (event.subtype && ["message_changed", "message_deleted", "channel_join", "channel_leave", "group_join", "group_leave"].includes(event.subtype)) {
        return;
    }

    try {
        const slack = await getClientForTeam(teamId);
        if (!slack) {
            console.error(`No auth found for team ${teamId}`);
            return;
        }

        const userInfo = await slack.users.info({ user: event.user });

        const mentionsRaw = event.text?.match(/<@([UW]\w+)>/g) || [];
        const mentions: IMention[] = [];

        for (const mentionStr of mentionsRaw) {
            const id = mentionStr.replace(/[<@>]/g, '');
            const resolved = await resolveMention(slack, id);
            if (resolved) mentions.push(resolved);
        }

        const attachments: IAttachment[] = (event.files || []).map((file: any) => ({
            name: file.name,
            url: file.url_private || file.url_private_download || ""
        }));

        const structured = {
            eventId: event.event_ts || event.ts,
            teamId: teamId,
            userId: event.user,
            userName: userInfo.user?.real_name || userInfo.user?.name || "Unknown",
            email: userInfo.user?.profile?.email || "No Email",
            channelId: event.channel,
            text: event.text,
            timestamp: Math.floor(parseFloat(event.ts)),
            threadTs: event.thread_ts ? Math.floor(parseFloat(event.thread_ts)) : null,
            mentions: mentions,
            attachments: attachments
        };

        const slackMessage = new SlackMessage(structured);
        await slackMessage.save();

        console.log(`Structured Info Saved: ${structured.userName} (${structured.email})`);
    } catch (err: any) {
        if (err.data?.error === 'invalid_auth') {
            console.error(`FATAL: Invalid Slack Auth Token for team ${teamId}.`);
        } else {
            console.error("Metadata Extraction Error:", err);
        }
    }
}

app.get("/", (req: Request, res: Response) => {
    res.status(200).send("Slack Intel Backend is Running 🚀");
});

app.get("/slack/oauth/callback", async (req: Request, res: Response) => {
    const { code } = req.query;
    
    if (!code) {
        return res.status(400).send("Missing code parameter");
    }

    try {
        const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: code
            }
        });

        const oauthData = response.data as any;

        if (!oauthData.ok) {
            console.error("Slack OAuth Error:", oauthData.error);
            return res.status(500).send(`OAuth Error: ${oauthData.error}`);
        }
        
        await SlackAuth.findOneAndUpdate(
            { teamId: oauthData.team.id },
            {
                teamId: oauthData.team.id,
                teamName: oauthData.team.name,
                accessToken: oauthData.access_token,
                botUserId: oauthData.bot_user_id,
                installerUserId: oauthData.authed_user.id,
                installedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Clear cache for this team
        delete clientCache[oauthData.team.id];

        res.status(200).send("<html><body><h1>App installed successfully!</h1><p>You can close this window and start using the bot in Slack.</p></body></html>");
    } catch (error) {
        console.error("OAuth Callback Error:", error);
        res.status(500).send("Internal Server Error during OAuth");
    }
});

app.post(["/", "/slack/events"], async (req: Request, res: Response) => {
    const { type, challenge, event, team_id } = req.body;

    if (type === "url_verification") {
        return res.status(200).send(challenge);
    }

    if (event && team_id) {
        try {
            if (event.type === "message" && !event.bot_id) {
                processEvent(event, team_id);
            }
        } catch (err) {
            console.error("Error handling event:", err);
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
