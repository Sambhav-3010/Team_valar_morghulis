// LLM Service Layer - Featherless AI Integration
export { generateCompletion, analyzeSentiment, batchAnalyzeSentiment } from './featherlessProvider';
export { generateHRInsights, generateProductInsights, generateEngineeringInsights } from './insightGenerator';
export { SYSTEM_PROMPTS, INSIGHT_GENERATION_PROMPT, JIRA_ANALYSIS_PROMPT, GITHUB_ANALYSIS_PROMPT } from './prompts';
