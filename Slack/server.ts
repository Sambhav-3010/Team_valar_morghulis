import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { RawEvent, Insight } from "./models";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/slack-intel";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// --- AI Processing Placeholder ---
async function processWithAI(rawEventId: any, event: any) {
    if (event.type !== "message" || event.bot_id) return;

    // In a real scenario, you'd call OpenAI/Gemini here.
    // We'll simulate a "task detection" logic for now.
    const text = event.text || "";
    const isTask = text.toLowerCase().includes("todo") || text.toLowerCase().includes("assign");

    const insight = new Insight({
        eventId: rawEventId,
        userId: event.user,
        channelId: event.channel,
        text: text,
        analysis: {
            taskName: isTask ? text.split(" ").slice(0, 5).join(" ") : undefined,
            sentiment: "Neutral",
            labels: isTask ? ["Task"] : ["General Communication"]
        }
    });

    await insight.save();
    console.log("Processed Insight Saved:", insight._id);
}

// --- App Home Dashboard Builder ---
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
                    { type: "mrkdwn", text: `*Structured Insights:*\n${totalInsights}` }
                ]
            },
            { type: "divider" },
            {
                type: "section",
                text: { type: "mrkdwn", text: "*Latest AI-Extracted Insights:*" }
            }
        ];

        recentInsights.forEach(insight => {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `• *${insight.analysis.labels.join(", ")}*: "${insight.text.substring(0, 50)}..."`
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

// --- Main Event Webhook ---
app.post(["/", "/slack/events"], async (req: Request, res: Response) => {
    const { type, challenge, event } = req.body;

    // 1. URL Verification
    if (type === "url_verification") {
        return res.status(200).send(challenge);
    }

    // 2. Event Handling
    if (event) {
        try {
            // Save Raw Event
            const raw = new RawEvent({
                type: event.type,
                event: event,
                raw: req.body
            });
            await raw.save();
            console.log(`Saved Raw Event: ${event.type}`);

            // Handle Specific Events
            if (event.type === "app_home_opened") {
                await updateAppHome(event.user);
            } else if (event.type === "message" && !event.bot_id) {
                // Trigger AI Processing
                processWithAI(raw._id, event);
            }
        } catch (err) {
            console.error("Error handling event:", err);
        }
    }

    res.sendStatus(200);
});

// --- Slash Command Example ---
app.post("/slack/commands", async (req: Request, res: Response) => {
    const { command, text, user_id } = req.body;

    if (command === "/intel") {
        res.status(200).send({
            text: "Processing your request... Check the App Home tab for the full dashboard!"
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
