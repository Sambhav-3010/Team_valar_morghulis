const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';
const DEFAULT_ORG_ID = 'acme-corp';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[API] Fetching:', url);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            credentials: 'include',
        });

        console.log('[API] Response status:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (err) {
        console.error('[API] Fetch error:', err);
        throw err;
    }
}

export interface Insight {
    id: string;
    category: 'observation' | 'anomaly' | 'trend' | 'suggestion' | 'risk' | 'praise' | 'workload' | 'process';
    persona: 'hr' | 'engineering' | 'product' | 'all';
    title: string;
    body: string;
    confidence: number;
    timestamp: string;
    relatedMetric?: string;
    source: string[];
}

export interface MetricPoint {
    date: string;
    value: number;
}

export interface SpaceMetrics {
    satisfaction: { current: number; previous: number; max: number; trend: MetricPoint[] };
    performance: { current: number; previous: number; max: number; trend: MetricPoint[] };
    activity: { current: number; previous: number; max: number; trend: MetricPoint[] };
    communication: { current: number; previous: number; max: number; trend: MetricPoint[] };
    efficiency: { current: number; previous: number; max: number; trend: MetricPoint[] };
    teamWellbeing: { balanced: number; high: number; low: number; overloaded: number };
}

export interface FlowMetrics {
    flowVelocity: { current: number; previous: number; unit: string; trend: MetricPoint[] };
    flowEfficiency: { current: number; previous: number; unit: string; trend: MetricPoint[] };
    flowTime: { current: number; previous: number; unit: string; trend: MetricPoint[] };
    flowLoad: { current: number; previous: number; unit: string; trend: MetricPoint[] };
    flowDistribution: { type: string; percentage: number; color: string }[];
    backlogHealth: { totalItems: number; refined: number; stale: number; blocked: number };
}

export interface DoraMetrics {
    deploymentFrequency: { current: number; previous: number; unit: string; trend: MetricPoint[]; rating: string };
    leadTime: { current: number; previous: number; unit: string; trend: MetricPoint[]; rating: string };
    changeFailureRate: { current: number; previous: number; unit: string; trend: MetricPoint[]; rating: string };
    mttr: { current: number; previous: number; unit: string; trend: MetricPoint[]; rating: string };
}

export interface Person {
    id: string;
    name: string;
    email: string;
    role: string;
    team: string;
    avatar: string;
    spaceScore: number;
    activityLevel: 'balanced' | 'high' | 'low' | 'overloaded';
}

export interface Project {
    id: string;
    name: string;
    team: string;
    status: 'on-track' | 'at-risk' | 'behind' | 'completed';
    health: number;
    progress: number;
}

export async function fetchInsights(persona?: string, limit?: number): Promise<Insight[]> {
    const params = new URLSearchParams();
    params.append('orgId', DEFAULT_ORG_ID);
    if (persona) params.append('persona', persona);
    if (limit) params.append('limit', String(limit));

    const queryString = params.toString();
    const endpoint = `/api/analytics/insights?${queryString}`;

    const response = await fetchAPI<{ success: boolean; insights: Insight[] }>(endpoint);
    return response.insights || [];
}

export async function fetchHRData(): Promise<{ metrics: SpaceMetrics; insights: Insight[] }> {
    return fetchAPI('/api/analytics/hr');
}

export async function fetchProductData(): Promise<{ metrics: FlowMetrics; insights: Insight[] }> {
    return fetchAPI('/api/analytics/product');
}

export async function fetchEngineeringData(): Promise<{ metrics: DoraMetrics; insights: Insight[] }> {
    return fetchAPI('/api/analytics/engineering');
}

export async function fetchProjects(): Promise<{ success: boolean; projects: Project[]; flowOverview: any }> {
    return fetchAPI(`/api/v2/projects?orgId=${DEFAULT_ORG_ID}`);
}

export async function fetchEmployees(): Promise<{ success: boolean; employees: any[] }> {
    return fetchAPI(`/api/v2/hr/employees?orgId=${DEFAULT_ORG_ID}`);
}

export async function fetchIdentities(): Promise<{ success: boolean; identities: any[] }> {
    return fetchAPI(`/api/v2/hr/identities?orgId=${DEFAULT_ORG_ID}`);
}

export async function fetchTechOverview(): Promise<{ success: boolean; overview: any }> {
    return fetchAPI(`/api/v2/tech/overview?orgId=${DEFAULT_ORG_ID}`);
}

export async function fetchProjectFlow(projectId: string): Promise<{ success: boolean; metrics: any }> {
    return fetchAPI(`/api/v2/projects/${projectId}/flow`);
}

export async function fetchProjectDora(projectId: string): Promise<{ success: boolean; metrics: any }> {
    return fetchAPI(`/api/v2/projects/${projectId}/dora`);
}

export async function triggerInsightGeneration(orgId?: string, projectId?: string): Promise<any> {
    return fetchAPI('/api/v2/insights/generate', {
        method: 'POST',
        body: JSON.stringify({ orgId: orgId || DEFAULT_ORG_ID, projectId, persona: 'all' }),
    });
}

export async function triggerTransformation(): Promise<any> {
    return fetchAPI('/api/v2/transform/run', { method: 'POST' });
}

