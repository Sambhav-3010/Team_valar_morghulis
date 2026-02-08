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
    console.log('--- Raw LLM Response ---');
    console.log(text);
    console.log('------------------------');

    // Remove comments (single line // and multi-line /* */)
    const storedText = text;
    // Be careful with URLs in text, standard regex for comments might be too aggressive if not careful.
    // For now, let's trust the LLM to output valid JSON mostly.

    try {
        // 1. Try extracting from markdown code blocks first (most common)
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
            try { return JSON.parse(match[1]); } catch (e) { console.error('Failed to parse code block JSON:', e); }
        }

        // 2. Try looking for the outermost array or object
        // We want to find the first '[' or '{' and the last ']' or '}'
        const firstOpenBrace = text.indexOf('{');
        const firstOpenBracket = text.indexOf('[');
        const lastCloseBrace = text.lastIndexOf('}');
        const lastCloseBracket = text.lastIndexOf(']');

        let jsonString = '';

        // Determine if it looks like an array or object
        // If we expect an array (insights list), favor brackets
        if (firstOpenBracket !== -1 && lastCloseBracket !== -1 && lastCloseBracket > firstOpenBracket) {
            jsonString = text.substring(firstOpenBracket, lastCloseBracket + 1);
            try { return JSON.parse(jsonString); } catch (e) {
                console.error('Failed to parse array JSON candidate:', e);
            }
        }

        if (firstOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > firstOpenBrace) {
            jsonString = text.substring(firstOpenBrace, lastCloseBrace + 1);
            try { return JSON.parse(jsonString); } catch (e) {
                console.error('Failed to parse object JSON candidate:', e);
            }
        }

        // 3. Fallback: try parsing the cleaned text
        text = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        return JSON.parse(text);
    } catch (error) {
        console.error('JSON Parsing failed completely:', error);
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
    // Fetch Slack messages for sentiment - NO LIMIT
    const slackActivities = await Activity.find({
        orgId,
        source: 'slack',
        activityType: 'message',
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group by User for HR
    const userActivities: Record<string, any[]> = {};
    slackActivities.forEach((activity: any) => {
        const user = activity.actorEmail || activity.actorName || 'Unknown';
        if (!userActivities[user]) {
            userActivities[user] = [];
        }
        // Send raw activity data
        userActivities[user].push(activity);
    });

    // Prepare raw data JSON
    const activityData = JSON.stringify({
        context: "HR_INSIGHTS",
        grouping: "BY_USER",
        period: { start: startDate, end: endDate },
        total_activities: slackActivities.length,
        users: userActivities
    }, null, 2);

    // Calculate basic sentiment stats for response metadata (optional, keep existing logic if needed or derive from LLM)
    // For now, keeping the simple sentiment calc for the return value, 
    // but the LLM gets the raw text.

    // Quick sentiment pass for the return object (not for LLM context, LLM gets raw)
    const messageTexts = slackActivities
        .map((a: any) => a.metadata?.text as string)
        .filter(t => t && t.length > 2);

    const avgSentiment = 0; // Placeholder as we are focusing on LLM insights

    // Generate insights
    console.log(`[HR] Generating insights for ${Object.keys(userActivities).length} users. Raw Data Length: ${activityData.length}`);
    if (activityData.length > 100000) console.warn('[HR] Warning: Activity data is very large.');

    const prompt = INSIGHT_GENERATION_PROMPT.replace('{activityData}', activityData);

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
    // Fetch Jira activities - NO LIMIT
    const jiraActivities = await Activity.find({
        orgId,
        source: 'jira',
        projectAlias: projectId,
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group by Project (Tech view)
    // Since we are already filtering by project, we just wrap it.
    // If we want multiple projects, we'd group. Here it's specific to one project ID.
    const projectActivities = {
        [projectId]: jiraActivities
    };

    // Prepare raw data JSON
    const activityData = JSON.stringify({
        context: "PRODUCT_INSIGHTS",
        grouping: "BY_PROJECT",
        period: { start: startDate, end: endDate },
        total_activities: jiraActivities.length,
        projects: projectActivities
    }, null, 2);

    const insightPrompt = INSIGHT_GENERATION_PROMPT.replace('{activityData}', activityData);

    console.log(`[Product] Generating insights for project ${projectId}. Raw Data Length: ${activityData.length}`);
    if (jiraActivities.length === 0) {
        console.warn(`[Product] WARNING: No Jira activities found for project ${projectId}. Context will be empty.`);
    }

    const jiraAnalysis = { ticketSentiment: 0, blockerRisk: 'low' };

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
    // Fetch GitHub activities - NO LIMIT
    const githubActivities = await Activity.find({
        orgId,
        source: 'github',
        projectAlias: projectId,
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group by Project (Tech view)
    const projectActivities = {
        [projectId]: githubActivities
    };

    // Prepare raw data JSON
    const activityData = JSON.stringify({
        context: "ENGINEERING_INSIGHTS",
        grouping: "BY_PROJECT",
        period: { start: startDate, end: endDate },
        total_activities: githubActivities.length,
        projects: projectActivities
    }, null, 2);

    const insightPrompt = INSIGHT_GENERATION_PROMPT.replace('{activityData}', activityData);

    console.log(`[Engineering] Generating insights for project ${projectId}. Raw Data Length: ${activityData.length}`);
    if (githubActivities.length === 0) {
        console.warn(`[Engineering] WARNING: No GitHub activities found for project ${projectId}. Context will be empty.`);
    }

    // Placeholder values for legacy return structure
    const githubAnalysis = { reviewFriction: 0, cultureScore: 0 };
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
