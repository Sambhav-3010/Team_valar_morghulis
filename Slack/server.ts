import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { SlackMessage, IMention, IAttachment } from "./models";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const MONGODB_URI = process.env.MONGODB_URI as string;
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

async function resolveMention(id: string): Promise<IMention | null> {
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

async function processEvent(event: any, teamId?: string) {
    if (event.type !== "message" || event.bot_id) return;

    if (event.subtype && ["message_changed", "message_deleted", "channel_join", "channel_leave", "group_join", "group_leave"].includes(event.subtype)) {
        return;
    }

    try {
        const userInfo = await slack.users.info({ user: event.user });

        const mentionsRaw = event.text?.match(/<@([UW]\w+)>/g) || [];
        const mentions: IMention[] = [];

        for (const mentionStr of mentionsRaw) {
            const id = mentionStr.replace(/[<@>]/g, '');
            const resolved = await resolveMention(id);
            if (resolved) mentions.push(resolved);
        }

        const attachments: IAttachment[] = (event.files || []).map((file: any) => ({
            name: file.name,
            url: file.url_private || file.url_private_download || ""
        }));

        const structured = {
            eventId: event.event_ts || event.ts,
            teamId: teamId || event.team || "",
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
            console.error("FATAL: Invalid Slack Auth Token. Please check your SLACK_BOT_TOKEN in .env.");
        } else {
            console.error("Metadata Extraction Error:", err);
        }
    }
}

app.get("/", (req: Request, res: Response) => {
    res.status(200).send("Slack Intel Backend is Running 🚀");
});

app.get("/slack/oauth/callback", (req: Request, res: Response) => {
    const { code } = req.query;
    if (code) {
        console.log("OAuth Code Received (Ready for exchange if needed):", code);
    }
    // For internal/org-wide installs, we just acknowledge the redirect.
    res.status(200).send("<html><body><h1>App installed successfully!</h1><p>You can close this window and start using the bot in Slack.</p></body></html>");
});

app.post(["/", "/slack/events"], async (req: Request, res: Response) => {
    const { type, challenge, event, team_id } = req.body;

    if (type === "url_verification") {
        return res.status(200).send(challenge);
    }

    if (event) {
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
