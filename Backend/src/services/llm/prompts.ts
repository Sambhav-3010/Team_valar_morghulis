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

export const INSIGHT_GENERATION_PROMPT = `Based on the following engineering activity data, generate insights.

Data Summary:
{dataSummary}

Generate 2-4 insights in this JSON format:
[
  {
    "category": "observation|anomaly|trend|suggestion",
    "title": "Brief title (max 60 chars)",
    "body": "Detailed explanation (100-200 words)",
    "confidence": 0.0-1.0,
    "relatedMetric": "optional metric name",
    "sources": ["source1", "source2"]
  }
]

Focus on actionable, specific observations. Avoid generic statements.`;

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
