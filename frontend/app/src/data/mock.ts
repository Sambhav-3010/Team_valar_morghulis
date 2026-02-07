// ──────────────────────────────────────────
// Mock data for the Synth Insights platform
// ──────────────────────────────────────────

export type Integration = {
  name: string;
  icon: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSync: string;
  recordCount: number;
};

export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  avatar: string;
  spaceScore: number;
  activityLevel: 'balanced' | 'high' | 'low' | 'overloaded';
};

export type Project = {
  id: string;
  name: string;
  team: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  health: number;
  progress: number;
};

export type AIInsight = {
  id: string;
  category: 'observation' | 'anomaly' | 'trend' | 'suggestion';
  persona: 'hr' | 'engineering' | 'product' | 'all';
  title: string;
  body: string;
  confidence: number;
  timestamp: string;
  relatedMetric?: string;
  source: string[];
};

export type MetricPoint = {
  date: string;
  value: number;
};

// ── Integrations ──
export const integrations: Integration[] = [
  { name: 'GitHub', icon: 'github', status: 'connected', lastSync: '3 min ago', recordCount: 12847 },
  { name: 'Jira', icon: 'kanban', status: 'connected', lastSync: '5 min ago', recordCount: 3241 },
  { name: 'Slack', icon: 'message-square', status: 'syncing', lastSync: 'syncing...', recordCount: 48293 },
  { name: 'Email', icon: 'mail', status: 'connected', lastSync: '12 min ago', recordCount: 8102 },
];

// ── People ──
export const people: Person[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@acme.io', role: 'Staff Engineer', team: 'Platform', avatar: 'SC', spaceScore: 87, activityLevel: 'balanced' },
  { id: '2', name: 'Marcus Johnson', email: 'marcus@acme.io', role: 'Senior Engineer', team: 'Frontend', avatar: 'MJ', spaceScore: 72, activityLevel: 'high' },
  { id: '3', name: 'Priya Patel', email: 'priya@acme.io', role: 'Engineering Manager', team: 'Backend', avatar: 'PP', spaceScore: 91, activityLevel: 'balanced' },
  { id: '4', name: 'Alex Rivera', email: 'alex@acme.io', role: 'Senior Engineer', team: 'Platform', avatar: 'AR', spaceScore: 58, activityLevel: 'overloaded' },
  { id: '5', name: 'Jordan Kim', email: 'jordan@acme.io', role: 'Product Manager', team: 'Growth', avatar: 'JK', spaceScore: 83, activityLevel: 'balanced' },
  { id: '6', name: 'Taylor Brooks', email: 'taylor@acme.io', role: 'Designer', team: 'Frontend', avatar: 'TB', spaceScore: 79, activityLevel: 'balanced' },
  { id: '7', name: 'David Park', email: 'david@acme.io', role: 'Junior Engineer', team: 'Backend', avatar: 'DP', spaceScore: 65, activityLevel: 'low' },
  { id: '8', name: 'Nina Okafor', email: 'nina@acme.io', role: 'Staff Engineer', team: 'Infrastructure', avatar: 'NO', spaceScore: 44, activityLevel: 'overloaded' },
];

// ── Projects ──
export const projects: Project[] = [
  { id: '1', name: 'Auth Service Rewrite', team: 'Platform', status: 'on-track', health: 92, progress: 73 },
  { id: '2', name: 'Dashboard V3', team: 'Frontend', status: 'at-risk', health: 64, progress: 48 },
  { id: '3', name: 'API Gateway Migration', team: 'Infrastructure', status: 'on-track', health: 88, progress: 85 },
  { id: '4', name: 'Mobile App MVP', team: 'Growth', status: 'behind', health: 45, progress: 32 },
  { id: '5', name: 'Data Pipeline V2', team: 'Backend', status: 'on-track', health: 95, progress: 91 },
  { id: '6', name: 'Search Overhaul', team: 'Platform', status: 'at-risk', health: 56, progress: 60 },
];

// ── DORA Metrics (Engineering) ──
export const doraMetrics = {
  deploymentFrequency: {
    current: 4.2,
    previous: 3.8,
    unit: 'deploys/day',
    trend: generateTrendData(30, 2.5, 5.0),
    rating: 'elite' as const,
  },
  leadTime: {
    current: 18.5,
    previous: 22.1,
    unit: 'hours',
    trend: generateTrendData(30, 15, 30),
    rating: 'high' as const,
  },
  changeFailureRate: {
    current: 3.2,
    previous: 4.8,
    unit: '%',
    trend: generateTrendData(30, 1, 8),
    rating: 'elite' as const,
  },
  mttr: {
    current: 1.4,
    previous: 2.1,
    unit: 'hours',
    trend: generateTrendData(30, 0.5, 3),
    rating: 'elite' as const,
  },
};

// ── FLOW Metrics (Product) ──
export const flowMetrics = {
  flowVelocity: {
    current: 42,
    previous: 38,
    unit: 'items/sprint',
    trend: generateTrendData(12, 30, 50),
  },
  flowEfficiency: {
    current: 68,
    previous: 61,
    unit: '%',
    trend: generateTrendData(12, 50, 80),
  },
  flowTime: {
    current: 5.2,
    previous: 6.8,
    unit: 'days',
    trend: generateTrendData(12, 3, 9),
  },
  flowLoad: {
    current: 28,
    previous: 34,
    unit: 'WIP items',
    trend: generateTrendData(12, 20, 40),
  },
  flowDistribution: [
    { type: 'Features', percentage: 45, color: 'var(--color-cyan)' },
    { type: 'Bugs', percentage: 20, color: 'var(--color-rose)' },
    { type: 'Tech Debt', percentage: 25, color: 'var(--color-accent)' },
    { type: 'Risks', percentage: 10, color: 'var(--color-violet)' },
  ],
  backlogHealth: {
    totalItems: 186,
    refined: 124,
    stale: 22,
    blocked: 8,
  },
};

// ── SPACE Metrics (HR) ──
export const spaceMetrics = {
  satisfaction: {
    current: 7.8,
    previous: 7.4,
    max: 10,
    trend: generateTrendData(12, 6.5, 8.5),
  },
  performance: {
    current: 82,
    previous: 78,
    max: 100,
    trend: generateTrendData(12, 70, 90),
  },
  activity: {
    current: 74,
    previous: 71,
    max: 100,
    trend: generateTrendData(12, 60, 85),
  },
  communication: {
    current: 86,
    previous: 82,
    max: 100,
    trend: generateTrendData(12, 70, 95),
  },
  efficiency: {
    current: 71,
    previous: 68,
    max: 100,
    trend: generateTrendData(12, 60, 80),
  },
  teamWellbeing: {
    balanced: 5,
    high: 1,
    low: 1,
    overloaded: 1,
  },
  collaborationNetwork: [
    { from: 'Platform', to: 'Backend', strength: 0.85 },
    { from: 'Platform', to: 'Frontend', strength: 0.62 },
    { from: 'Frontend', to: 'Growth', strength: 0.74 },
    { from: 'Backend', to: 'Infrastructure', strength: 0.91 },
    { from: 'Growth', to: 'Backend', strength: 0.45 },
    { from: 'Infrastructure', to: 'Platform', strength: 0.78 },
  ],
};

// ── AI Insights ──
export const aiInsights: AIInsight[] = [
  {
    id: '1',
    category: 'anomaly',
    persona: 'engineering',
    title: 'Unusual spike in change failure rate for Frontend team',
    body: 'Over the past 5 days, the Frontend team\'s change failure rate has increased from 2.1% to 7.8%. This appears to correlate with the Dashboard V3 project entering its integration phase. It may be worth reviewing the test coverage for recently merged branches.',
    confidence: 0.82,
    timestamp: '2h ago',
    relatedMetric: 'Change Failure Rate',
    source: ['GitHub', 'Jira'],
  },
  {
    id: '2',
    category: 'trend',
    persona: 'hr',
    title: 'Collaboration patterns shifting in Infrastructure team',
    body: 'Nina Okafor\'s cross-team communication has decreased by 40% over the past two weeks, while her commit volume has increased significantly. This pattern sometimes indicates deep focus work, but could also signal isolation. A check-in might be helpful.',
    confidence: 0.71,
    timestamp: '4h ago',
    relatedMetric: 'SPACE - Communication',
    source: ['Slack', 'GitHub', 'Email'],
  },
  {
    id: '3',
    category: 'observation',
    persona: 'product',
    title: 'Mobile App MVP may need scope reassessment',
    body: 'Based on current flow velocity and the remaining backlog, the Mobile App MVP project is trending toward a 3-week delay from its original timeline. The team\'s WIP limit has been consistently exceeded, which typically correlates with slower delivery. Consider a scope review.',
    confidence: 0.76,
    timestamp: '6h ago',
    relatedMetric: 'Flow Velocity',
    source: ['Jira', 'GitHub'],
  },
  {
    id: '4',
    category: 'suggestion',
    persona: 'engineering',
    title: 'Lead time improvement opportunity in Backend team',
    body: 'The Backend team\'s code review turnaround has improved by 35% since adopting smaller PRs. If the Platform team adopted a similar approach, models suggest their lead time could decrease by approximately 15-20%.',
    confidence: 0.68,
    timestamp: '1d ago',
    relatedMetric: 'Lead Time',
    source: ['GitHub'],
  },
  {
    id: '5',
    category: 'trend',
    persona: 'hr',
    title: 'Team satisfaction trending upward',
    body: 'Sentiment analysis across Slack channels shows a steady improvement in team morale over the past month. Key contributing factors appear to be the successful Data Pipeline V2 delivery and the recent team offsite. Six out of eight tracked individuals show improved engagement signals.',
    confidence: 0.65,
    timestamp: '1d ago',
    relatedMetric: 'SPACE - Satisfaction',
    source: ['Slack', 'Email'],
  },
  {
    id: '6',
    category: 'anomaly',
    persona: 'product',
    title: 'Search Overhaul blocked items increasing',
    body: 'The number of blocked items in the Search Overhaul project has doubled in the last sprint. Most blockers trace back to unresolved API contract decisions between Platform and Backend teams. Resolving these dependencies could unblock 6 items immediately.',
    confidence: 0.85,
    timestamp: '8h ago',
    relatedMetric: 'Flow Load',
    source: ['Jira'],
  },
  {
    id: '7',
    category: 'observation',
    persona: 'all',
    title: 'Deployment cadence is at an all-time high',
    body: 'The organization is deploying at 4.2 times per day on average, the highest in the past quarter. This is primarily driven by the Platform and Backend teams. The increase has not come with a proportional rise in failure rates, suggesting healthy engineering practices.',
    confidence: 0.91,
    timestamp: '12h ago',
    relatedMetric: 'Deployment Frequency',
    source: ['GitHub'],
  },
];

// ── Activity Feed ──
export const activityFeed = [
  { id: '1', type: 'deploy', message: 'Auth Service deployed to production', team: 'Platform', time: '12m ago', source: 'github' },
  { id: '2', type: 'pr', message: '3 PRs merged in API Gateway Migration', team: 'Infrastructure', time: '28m ago', source: 'github' },
  { id: '3', type: 'sprint', message: 'Sprint 24 completed — 38/42 items delivered', team: 'All', time: '2h ago', source: 'jira' },
  { id: '4', type: 'alert', message: 'Build pipeline timeout on Dashboard V3', team: 'Frontend', time: '3h ago', source: 'github' },
  { id: '5', type: 'insight', message: 'AI detected unusual review patterns', team: 'Platform', time: '4h ago', source: 'ai' },
  { id: '6', type: 'milestone', message: 'Data Pipeline V2 reached 90% completion', team: 'Backend', time: '6h ago', source: 'jira' },
];

// ── Helper to generate trend data ──
function generateTrendData(points: number, min: number, max: number): MetricPoint[] {
  const data: MetricPoint[] = [];
  const now = new Date();
  let value = min + (max - min) * 0.4;

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.45) * (max - min) * 0.15;
    value = Math.max(min, Math.min(max, value));
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

// ── Summary stats for home ──
export const orgSummary = {
  totalPeople: 8,
  totalProjects: 6,
  activeIntegrations: 4,
  insightsGenerated: 47,
  overallHealth: 78,
  weeklyChange: +4.2,
};
