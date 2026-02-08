/**
 * LLM Prompts for Insight Generation
 * Persona-specific prompts for analyzing engineering data
 */

export const SYSTEM_PROMPTS = {
  hr: `You are an HR analytics expert analyzing engineering team dynamics.
Focus on:
- Individual wellbeing signals (overwork, isolation, burnout risk)
- Collaboration patterns and communication health
- Satisfaction indicators from message sentiment
- Work-life balance signals

Output insights that are supportive, not evaluative. Frame observations constructively.`,

  engineering: `You are a DevOps and engineering excellence expert.
Focus on:
- Code review patterns and bottlenecks
- Deployment health and failure patterns
- Technical debt indicators
- Developer productivity signals

Output actionable insights for tech leads. Be specific about which projects or patterns need attention.`,

  product: `You are a product delivery expert analyzing project flow.
Focus on:
- Backlog health and blocked items
- Velocity trends and predictability
- Scope creep indicators
- Delivery confidence signals

Output insights for product managers. Highlight risks and opportunities.`
};

export const INSIGHT_GENERATION_PROMPT = `Based on the following raw activity data, generate insights.
The data is provided in JSON format. Analyze the patterns, timestamps, and metadata directly.

Activity Data:
{activityData}

Generate 5-7 insights in this JSON format:
[
  {
    "category": "observation|anomaly|trend|suggestion",
    "title": "Brief title (max 60 chars)",
    "body": "Detailed explanation (100-200 words)",
    "confidence": 0.0-1.0,
    "relatedMetric": "optional metric name",
    "source": ["source1", "source2"]
  }
]

IMPORTANT:
1. Return ONLY valid JSON.
2. No markdown formatting.
3. No comments (// or /* */).
4. Do not include 'comments' field in response.
5. Generate between 5 to 7 unique, actionable insights.
6. Use strict categories: "observation", "anomaly", "trend", "suggestion", "risk", "praise", "workload", "process".
7. Be specific about the data points (e.g., mention specific tickets or users).
8. Do NOT include comments (// or /* */) in the JSON. Return standard JSON only.
9. Do NOT modify the input data; use it exactly as provided to find patterns.
10. Consider the entire dataset provided without filtering.`;

export const SENTIMENT_ANALYSIS_PROMPT = `Analyze the emotional tone of these messages from an engineering team context.

Messages:
{messages}

For each message, assess:
1. Overall sentiment (-1 to 1)
2. Stress indicators (frustration, urgency, overwhelm)
3. Collaboration signals (supportive, constructive, dismissive)

Return JSON:
{
  "overallSentiment": -1 to 1,
  "stressLevel": "low|medium|high",
  "collaborationHealth": "healthy|neutral|concerning",
  "summary": "Brief assessment"
}`;

export const JIRA_ANALYSIS_PROMPT = `Analyze these Jira ticket patterns for project health.

Ticket Data:
- Total: {total}
- Resolved: {resolved}
- Unresolved: {unresolved}
- Blocked: {blocked}
- Avg Resolution Time: {avgResTime} hours
- Recent Comments Sample: {comments}

Assess:
1. Ticket sentiment (are comments frustrated or constructive?)
2. Resolution efficiency
3. Blocker patterns

IMPORTANT:
1. Return ONLY valid JSON.
2. No markdown formatting.
3. No comments (// or /* */).
4. Do not include 'comments' field in response.

Return JSON:
{
  "ticketSentiment": -1 to 1,
  "efficiencyScore": 0 to 100,
  "blockerRisk": "low|medium|high",
  "summary": "Brief assessment"
}`;

export const GITHUB_ANALYSIS_PROMPT = `Analyze these GitHub patterns for engineering health.

Data:
- PRs: {prCount}
- Merged: {merged}
- Avg Review Time: {avgReviewTime} hours
- Review Comments Sample: {reviewComments}
- Commit Messages Sample: {commitMessages}

Assess:
1. Review culture (constructive vs toxic feedback)
2. Merge velocity
3. Code quality signals

IMPORTANT:
1. Return ONLY valid JSON.
2. No markdown formatting.
3. No comments (// or /* */).
4. Do not include 'comments' or 'messages' fields in response.

Return JSON:
{
  "reviewFriction": 0 to 1 (1 = high friction),
  "velocityHealth": "good|moderate|slow",
  "cultureScore": 0 to 100,
  "summary": "Brief assessment"
}`;

export default {
  SYSTEM_PROMPTS,
  INSIGHT_GENERATION_PROMPT,
  SENTIMENT_ANALYSIS_PROMPT,
  JIRA_ANALYSIS_PROMPT,
  GITHUB_ANALYSIS_PROMPT
};
