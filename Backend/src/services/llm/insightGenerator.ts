import { Activity, Insight } from '../../models';
import { generateCompletion, batchAnalyzeSentiment } from './featherlessProvider';
import { SYSTEM_PROMPTS, INSIGHT_GENERATION_PROMPT, JIRA_ANALYSIS_PROMPT, GITHUB_ANALYSIS_PROMPT } from './prompts';

export interface InsightGenerationResult {
    insights: Array<{
        category: string;
        title: string;
        body: string;
        confidence: number;
        relatedMetric?: string;
        source: string[];
    }>;
    sentimentData?: {
        slack?: { overallSentiment: number; stressLevel: string };
        jira?: { ticketSentiment: number; blockerRisk: string };
        github?: { reviewFriction: number; cultureScore: number };
    };
}

/**
 * Helper to extract JSON from LLM response
 */
function extractJSON(text: string): any {
    // Remove comments (single line // and multi-line /* */)
    const storedText = text;
    text = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    try {
        // 1. Try direct parse
        return JSON.parse(text);
    } catch {
        // 2. Try extracting from markdown code blocks
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
            try { return JSON.parse(match[1]); } catch { }
        }
        // 3. Try finding array brackets
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
            try { return JSON.parse(text.substring(start, end + 1)); } catch { }
        }
        // 4. Try finding object braces
        const startObj = text.indexOf('{');
        const endObj = text.lastIndexOf('}');
        if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
            try { return JSON.parse(text.substring(startObj, endObj + 1)); } catch { }
        }
        // Fallback: try parsing the original text just in case comment stripping broke something (unlikely but safe)
        try { return JSON.parse(storedText); } catch { }

        return [];
    }
}

/**
 * Generate insights for HR persona (SPACE metrics focus)
 */
export async function generateHRInsights(
    orgId: string,
    startDate: Date,
    endDate: Date
): Promise<InsightGenerationResult> {
    // Fetch Slack messages for sentiment
    const slackActivities = await Activity.find({
        orgId,
        source: 'slack',
        activityType: 'message',
        timestamp: { $gte: startDate, $lte: endDate }
    }).limit(50).lean();

    // Extract message texts
    const messageTexts = slackActivities
        .map(a => a.metadata?.text as string)
        .filter(t => t && t.length > 10);

    // Batch sentiment analysis -  Simple mock for now to verify pipeline, or single calls.
    // Gemini 2.0 Flash is fast, we can do parallel calls.
    const sentiments = await Promise.all(messageTexts.slice(0, 5).map(async (text) => {
        const prompt = `Classify sentiment: "${text}". JSON: {"score": -1 to 1, "label": "positive"|"neutral"|"negative"}`;
        try {
            const res = await generateCompletion([{ role: 'user', content: prompt }], { temperature: 0.1 });
            const json = JSON.parse(res);
            return { score: json.score || 0, label: json.label || 'neutral' };
        } catch {
            return { score: 0, label: 'neutral' };
        }
    }));

    const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((s, p) => s + p.score, 0) / sentiments.length
        : 0;

    // Build data summary with more context
    const dataSummary = `
- Slack Messages Analyzed: ${slackActivities.length}
- Average Sentiment Score: ${avgSentiment.toFixed(2)} (-1 to 1 scale)
- Negative Messages: ${sentiments.filter(s => s.label === 'negative').length}
- Active Users: ${[...new Set(slackActivities.map(a => a.actorEmail))].slice(0, 5).join(', ')}
- Sample Topics: ${messageTexts.slice(0, 3).map(t => `"${t.substring(0, 40)}..."`).join(', ')}
- Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}
`;

    // Generate insights
    const prompt = INSIGHT_GENERATION_PROMPT.replace('{dataSummary}', dataSummary);

    const response = await generateCompletion([
        { role: 'system', content: SYSTEM_PROMPTS.hr },
        { role: 'user', content: prompt }
    ], { temperature: 0.7 });


    let insights: InsightGenerationResult['insights'] = [];
    const parsed = extractJSON(response);
    if (Array.isArray(parsed)) {
        insights = parsed;
    } else if (parsed && Array.isArray(parsed.insights)) {
        insights = parsed.insights; // Handle case where it wraps in { "insights": [...] }
    }

    // Save insights to DB
    for (const insight of insights) {
        await Insight.create({
            orgId,
            category: insight.category || 'observation',
            persona: 'hr',
            title: insight.title,
            body: insight.body,
            confidence: insight.confidence || 0.5,
            relatedMetric: insight.relatedMetric,
            source: insight.source || ['Slack'],
            generatedAt: new Date()
        });
    }

    return {
        insights,
        sentimentData: {
            slack: {
                overallSentiment: avgSentiment,
                stressLevel: avgSentiment < -0.3 ? 'high' : avgSentiment < 0 ? 'medium' : 'low'
            }
        }
    };
}

/**
 * Generate insights for Product persona (FLOW metrics focus)
 */
export async function generateProductInsights(
    orgId: string,
    projectId: string,
    startDate: Date,
    endDate: Date
): Promise<InsightGenerationResult> {
    // Fetch Jira activities
    const jiraActivities = await Activity.find({
        orgId,
        source: 'jira',
        projectAlias: projectId,
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    const ticketCreated = jiraActivities.filter(a => a.activityType === 'ticket_created');
    const statusChanges = jiraActivities.filter(a => a.activityType === 'status_change');
    const resolved = statusChanges.filter(s =>
        s.metadata?.toStatus?.toLowerCase().includes('done') ||
        s.metadata?.toStatus?.toLowerCase().includes('closed')
    );

    // Extract comments from metadata
    const comments = jiraActivities
        .map(a => a.metadata?.comment as string)
        .filter(c => c && c.length > 5)
        .slice(0, 5);

    const prompt = JIRA_ANALYSIS_PROMPT
        .replace('{total}', String(ticketCreated.length))
        .replace('{resolved}', String(resolved.length))
        .replace('{unresolved}', String(ticketCreated.length - resolved.length))
        .replace('{blocked}', String(statusChanges.filter(s => s.metadata?.toStatus?.toLowerCase().includes('blocked')).length))
        .replace('{avgResTime}', '48') // Placeholder
        .replace('{comments}', comments.join(' | ') || 'No comments');

    const response = await generateCompletion([
        { role: 'system', content: SYSTEM_PROMPTS.product },
        { role: 'user', content: prompt }
    ], { temperature: 0.5 });

    let jiraAnalysis = { ticketSentiment: 0, efficiencyScore: 50, blockerRisk: 'medium', summary: '' };
    try {
        jiraAnalysis = JSON.parse(response);
    } catch { }

    // Generate main insights
    const dataSummary = `
- Project: ${projectId}
- Tickets Created: ${ticketCreated.length}
- Tickets Resolved: ${resolved.length}
- Ticket Sentiment: ${jiraAnalysis.ticketSentiment}
- Blocker Risk: ${jiraAnalysis.blockerRisk}
- Blocked Items Count: ${statusChanges.filter(s => s.metadata?.toStatus?.toLowerCase().includes('blocked')).length}
- Sample Ticket Titles: ${ticketCreated.map(t => t.metadata?.title).slice(0, 3).join(', ')}
`;

    const insightPrompt = INSIGHT_GENERATION_PROMPT.replace('{dataSummary}', dataSummary);
    const insightResponse = await generateCompletion([
        { role: 'system', content: SYSTEM_PROMPTS.product },
        { role: 'user', content: insightPrompt }
    ], { temperature: 0.7 });

    let insights: InsightGenerationResult['insights'] = [];
    try {
        insights = JSON.parse(insightResponse);
        if (!Array.isArray(insights)) insights = [];
    } catch { }

    // Save insights
    for (const insight of insights) {
        await Insight.create({
            orgId,
            category: insight.category || 'observation',
            persona: 'product',
            title: insight.title,
            body: insight.body,
            confidence: insight.confidence || 0.5,
            relatedMetric: insight.relatedMetric,
            relatedProjectId: projectId,
            source: insight.source || ['Jira'],
            generatedAt: new Date()
        });
    }

    return {
        insights,
        sentimentData: {
            jira: {
                ticketSentiment: jiraAnalysis.ticketSentiment,
                blockerRisk: jiraAnalysis.blockerRisk
            }
        }
    };
}

/**
 * Generate insights for Engineering persona (DORA metrics focus)
 */
export async function generateEngineeringInsights(
    orgId: string,
    projectId: string,
    startDate: Date,
    endDate: Date
): Promise<InsightGenerationResult> {
    // Fetch GitHub activities
    const githubActivities = await Activity.find({
        orgId,
        source: 'github',
        projectAlias: projectId,
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    const commits = githubActivities.filter(a => a.activityType === 'commit');
    const prs = githubActivities.filter(a => a.activityType === 'pull_request');
    const reviews = githubActivities.filter(a => a.activityType === 'review');
    const merged = prs.filter(p => p.metadata?.merged || p.metadata?.prState === 'merged');

    // Extract review comments
    const reviewComments = reviews
        .map(r => r.metadata?.body as string)
        .filter(b => b && b.length > 5)
        .slice(0, 5);

    const commitMessages = commits
        .map(c => c.metadata?.message as string)
        .filter(m => m && m.length > 5)
        .slice(0, 5);

    const prompt = GITHUB_ANALYSIS_PROMPT
        .replace('{prCount}', String(prs.length))
        .replace('{merged}', String(merged.length))
        .replace('{avgReviewTime}', '12') // Placeholder
        .replace('{reviewComments}', reviewComments.join(' | ') || 'No comments')
        .replace('{commitMessages}', commitMessages.join(' | ') || 'No messages');

    const response = await generateCompletion([
        { role: 'system', content: SYSTEM_PROMPTS.engineering },
        { role: 'user', content: prompt }
    ], { temperature: 0.5 });

    let githubAnalysis = { reviewFriction: 0.5, velocityHealth: 'moderate', cultureScore: 50, summary: '' };
    try {
        githubAnalysis = JSON.parse(response);
    } catch { }

    // Generate main insights
    const dataSummary = `
- Project: ${projectId}
- Commits: ${commits.length}
- PRs: ${prs.length}
- Merged: ${merged.length}
- Reviews: ${reviews.length}
- Review Friction: ${githubAnalysis.reviewFriction}
- Culture Score: ${githubAnalysis.cultureScore}
- Active Contributors: ${[...new Set(commits.map(c => c.actorEmail).concat(prs.map(p => p.actorEmail)))].slice(0, 5).join(', ')}
- Recent Commit Messages: ${commitMessages.slice(0, 3).join(', ')}
`;

    const insightPrompt = INSIGHT_GENERATION_PROMPT.replace('{dataSummary}', dataSummary);
    const insightResponse = await generateCompletion([
        { role: 'system', content: SYSTEM_PROMPTS.engineering },
        { role: 'user', content: insightPrompt }
    ], { temperature: 0.7 });

    let insights: InsightGenerationResult['insights'] = [];
    try {
        insights = JSON.parse(insightResponse);
        if (!Array.isArray(insights)) insights = [];
    } catch { }

    // Save insights
    for (const insight of insights) {
        await Insight.create({
            orgId,
            category: insight.category || 'observation',
            persona: 'engineering',
            title: insight.title,
            body: insight.body,
            confidence: insight.confidence || 0.5,
            relatedMetric: insight.relatedMetric,
            relatedProjectId: projectId,
            source: insight.source || ['GitHub'],
            generatedAt: new Date()
        });
    }

    return {
        insights,
        sentimentData: {
            github: {
                reviewFriction: githubAnalysis.reviewFriction,
                cultureScore: githubAnalysis.cultureScore
            }
        }
    };
}

export default {
    generateHRInsights,
    generateProductInsights,
    generateEngineeringInsights
};
