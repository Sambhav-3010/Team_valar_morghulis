import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { RawEvent, Insight, IMention, IAttachment } from "./models";

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
        if (error.data?.error === 'user_not_found') {
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

async function processEvent(rawEventId: any, event: any, teamId?: string) {
    if (event.type !== "message" || event.bot_id) return;

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
            eventId: rawEventId,
            teamId: teamId || event.team || "",
            userId: event.user,
            userName: userInfo.user?.real_name || userInfo.user?.name || "Unknown",
            email: userInfo.user?.profile?.email || "No Email",
            channelId: event.channel,
            text: event.text,
            timestamp: Math.floor(parseFloat(event.ts)),
            threadTs: event.thread_ts ? Math.floor(parseFloat(event.thread_ts)) : null,
            mentions: mentions,
            attachments: attachments,
            raw: event
        };

        const insight = new Insight(structured);
        await insight.save();

        console.log(`Structured Info Saved: ${structured.userName} mentions ${mentions.length} people and shared ${attachments.length} files.`);
    } catch (err: any) {
        if (err.data?.error === 'invalid_auth') {
            console.error("FATAL: Invalid Slack Auth Token. Please check your SLACK_BOT_TOKEN in .env.");
        } else if (err.data?.error === 'user_not_found') {
            console.warn("User not found during event processing, event recorded with truncated info.");
        } else {
            console.error("Metadata Extraction Error:", err);
        }
    }
}

async function updateAppHome(userId: string) {
    try {
        const totalEvents = await RawEvent.countDocuments();
        const totalInsights = await Insight.countDocuments();
        const recentInsights = await Insight.find().sort({ createdAt: -1 }).limit(5);

        const blocks = [
            {
                type: "header",
                text: { type: "plain_text", text: "🚀 Enterprise Intelligence Dashboard" }
            },
            {
                type: "section",
                fields: [
                    { type: "mrkdwn", text: `*Total Events Captured:*\n${totalEvents}` },
                    { type: "mrkdwn", text: `*Structured Records:*\n${totalInsights}` }
                ]
            },
            { type: "divider" },
            {
                type: "section",
                text: { type: "mrkdwn", text: "*Latest Informational Feed:*" }
            }
        ];

        recentInsights.forEach(insight => {
            const mentionText = insight.mentions.length > 0
                ? `\n*Mentions:* ${insight.mentions.map(m => `@${m.name}`).join(', ')}`
                : '';
            const fileText = insight.attachments.length > 0
                ? `\n*Files:* ${insight.attachments.map(f => `[${f.name}]`).join(', ')}`
                : '';

            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `• *${insight.userName}* (${insight.email})${mentionText}${fileText}\n*Msg:* "${insight.text?.substring(0, 80)}..."`
                }
            } as any);
        });

        await slack.views.publish({
            user_id: userId,
            view: {
                type: "home",
                blocks: blocks as any
            }
        });
    } catch (error) {
        console.error("Error updating App Home:", error);
    }
}

app.post(["/", "/slack/events"], async (req: Request, res: Response) => {
    const { type, challenge, event, team_id } = req.body;

    if (type === "url_verification") {
        return res.status(200).send(challenge);
    }

    if (event) {
        try {
            const raw = new RawEvent({
                type: event.type,
                event: event,
                raw: req.body
            });
            await raw.save();

            if (event.type === "app_home_opened") {
                await updateAppHome(event.user);
            } else if (event.type === "message" && !event.bot_id) {
                processEvent(raw._id, event, team_id);
            }
        } catch (err) {
            console.error("Error handling event:", err);
        }
    }

    res.sendStatus(200);
});

app.post("/slack/commands", async (req: Request, res: Response) => {
    const { command, text, user_id } = req.body;

    if (command === "/intel") {
        res.status(200).send({
            text: "Processing your request... Check the App Home tab!"
        });
        await updateAppHome(user_id);
    } else {
        res.sendStatus(200);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
