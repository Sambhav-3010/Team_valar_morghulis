/**
 * Metrics Service
 * Generates mock metrics matching the frontend schema structure
 */

interface MetricTrend {
    date: string;
    value: number;
}

function generateTrendData(points: number, min: number, max: number): MetricTrend[] {
    const data: MetricTrend[] = [];
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

// ── DORA Metrics (Engineering) ──
export const getDoraMetrics = () => ({
    deploymentFrequency: {
        current: 4.2,
        previous: 3.8,
        unit: 'deploys/day',
        trend: generateTrendData(30, 2.5, 5.0),
        rating: 'elite',
    },
    leadTime: {
        current: 18.5,
        previous: 22.1,
        unit: 'hours',
        trend: generateTrendData(30, 15, 30),
        rating: 'high',
    },
    changeFailureRate: {
        current: 3.2,
        previous: 4.8,
        unit: '%',
        trend: generateTrendData(30, 1, 8),
        rating: 'elite',
    },
    mttr: {
        current: 1.4,
        previous: 2.1,
        unit: 'hours',
        trend: generateTrendData(30, 0.5, 3),
        rating: 'elite',
    },
});

// ── FLOW Metrics (Product) ──
export const getFlowMetrics = () => ({
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
});

// ── SPACE Metrics (HR) ──
export const getSpaceMetrics = () => ({
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
});

export default {
    getDoraMetrics,
    getFlowMetrics,
    getSpaceMetrics
};
