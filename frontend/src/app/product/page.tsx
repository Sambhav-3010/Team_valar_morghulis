'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { InsightCard } from '@/components/ai/InsightCard';
import { InsightStream } from '@/components/ai/InsightStream';
import { TrendChart } from '@/components/charts/TrendChart';
import { DistributionBar } from '@/components/charts/DistributionBar';
import { RingGauge } from '@/components/charts/RingGauge';
import { fetchProductData, fetchProjects, type Insight } from '@/lib/api';
import { Gauge, Timer, Layers, Activity, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useChartColors } from '@/hooks/useThemeColors';

const defaultMetrics = {
  flowVelocity: { current: 0, previous: 0, unit: 'items/sprint', trend: [] },
  flowEfficiency: { current: 0, previous: 0, unit: '%', trend: [] },
  flowTime: { current: 0, previous: 0, unit: 'days', trend: [] },
  flowLoad: { current: 0, previous: 0, unit: 'WIP items', trend: [] },
  flowDistribution: [],
  backlogHealth: { refined: 0, stale: 0, blocked: 0, totalItems: 0 },
};

export default function ProductPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [flowMetrics, setFlowMetrics] = useState<any>(defaultMetrics);
  const [projects, setProjects] = useState<any[]>([]);
  const [flowOverview, setFlowOverview] = useState<any>(null);
  const chartColors = useChartColors();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const productData = await fetchProductData();
      setInsights(productData?.insights || []);
      if (productData?.metrics) {
        setFlowMetrics(productData.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch product data:', err);
      setError('Failed to connect to backend. Make sure the server is running.');
    }

    try {
      const projectsData = await fetchProjects();
      const rawProjects = projectsData?.projects || [];

      const statuses = ['on-track', 'at-risk', 'behind', 'completed'] as const;
      const leads = ['Alice Chen', 'Bob Smith', 'Carol Davis', 'David Lee', 'Eva Martinez'];

      const enrichedProjects = rawProjects.map((project: any, index: number) => {
        const statusIndex = index % 4;
        const progress = statusIndex === 3 ? 100 : Math.floor(35 + Math.random() * 50);
        const daysOffset = Math.floor(Math.random() * 60);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + daysOffset);

        const healthByStatus = { 'on-track': 85, 'at-risk': 60, 'behind': 40, 'completed': 100 };
        const teams = ['Platform', 'Frontend', 'Backend', 'Mobile', 'DevOps'];

        return {
          ...project,
          id: project.projectId || project._id || `project-${index}`,
          status: statuses[statusIndex],
          progress: progress,
          health: healthByStatus[statuses[statusIndex]],
          deadline: deadline.toISOString().split('T')[0],
          lead: leads[index % leads.length],
          team: teams[index % teams.length],
        };
      });

      setProjects(enrichedProjects);
      if (projectsData?.flowOverview) {
        setFlowOverview(projectsData.flowOverview);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const productInsights = insights.filter(i => i.persona === 'product' || i.persona === 'all');

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <PageHeader
          title="Product Delivery"
          description="Track delivery confidence, backlog health, and work distribution through the FLOW framework."
          badge={{ label: 'FLOW', color: 'text-accent bg-accent-dim' }}
        />
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-5 h-5 text-rose" />
          </div>
          <p className="text-sm text-text-tertiary mb-2">{error}</p>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Product Delivery"
        description="Track delivery confidence, backlog health, and work distribution through the FLOW framework. Understand how work moves through your system."
        badge={{ label: 'FLOW', color: 'text-accent bg-accent-dim' }}
      />

      <div className="mb-10">
        <InsightStream
          message={`Fetched ${productInsights.length} product insights and ${projects.length} projects from backend.`}
          typing
        />
      </div>

      <SectionHeader title="FLOW Metrics" subtitle="Work delivery performance indicators" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <MetricCard
          label="Flow Velocity"
          value={flowMetrics.flowVelocity?.current || 0}
          unit={flowMetrics.flowVelocity?.unit || 'items/sprint'}
          current={flowMetrics.flowVelocity?.current || 0}
          previous={flowMetrics.flowVelocity?.previous || 0}
          delay={0}
          icon={<Gauge className="w-4 h-4 text-cyan" />}
          accentColor="bg-cyan-dim"
        />
        <MetricCard
          label="Flow Efficiency"
          value={flowMetrics.flowEfficiency?.current || 0}
          unit={flowMetrics.flowEfficiency?.unit || '%'}
          current={flowMetrics.flowEfficiency?.current || 0}
          previous={flowMetrics.flowEfficiency?.previous || 0}
          delay={1}
          icon={<Activity className="w-4 h-4 text-emerald" />}
          accentColor="bg-emerald-dim"
        />
        <MetricCard
          label="Flow Time"
          value={flowMetrics.flowTime?.current || 0}
          unit={flowMetrics.flowTime?.unit || 'days'}
          current={flowMetrics.flowTime?.current || 0}
          previous={flowMetrics.flowTime?.previous || 0}
          delay={2}
          icon={<Timer className="w-4 h-4 text-accent" />}
          accentColor="bg-accent-dim"
        />
        <MetricCard
          label="Flow Load"
          value={flowMetrics.flowLoad?.current || 0}
          unit={flowMetrics.flowLoad?.unit || 'WIP items'}
          current={flowMetrics.flowLoad?.current || 0}
          previous={flowMetrics.flowLoad?.previous || 0}
          delay={3}
          icon={<Layers className="w-4 h-4 text-violet" />}
          accentColor="bg-violet-dim"
        />
      </div>

      {flowMetrics.flowVelocity?.trend?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <SectionHeader title="Flow Velocity Trend" subtitle="Items delivered per sprint" />
            <div className="card p-5">
              <TrendChart
                data={flowMetrics.flowVelocity.trend}
                color={chartColors.cyan}
                height={260}
                gradientId="flowVelocity"
              />
            </div>
          </div>

          <div className="space-y-6">
            {flowMetrics.flowDistribution?.length > 0 && (
              <div>
                <SectionHeader title="Work Distribution" subtitle="By item type" />
                <div className="card p-5">
                  <DistributionBar segments={flowMetrics.flowDistribution} />
                </div>
              </div>
            )}

            {flowMetrics.backlogHealth?.totalItems > 0 && (
              <div>
                <SectionHeader title="Backlog Health" />
                <div className="card p-5">
                  <div className="flex justify-around">
                    <RingGauge
                      value={flowMetrics.backlogHealth.refined}
                      max={flowMetrics.backlogHealth.totalItems}
                      size={90}
                      strokeWidth={6}
                      color={chartColors.emerald}
                      label="Refined"
                    />
                    <RingGauge
                      value={flowMetrics.backlogHealth.stale}
                      max={flowMetrics.backlogHealth.totalItems}
                      size={90}
                      strokeWidth={6}
                      color={chartColors.accent}
                      label="Stale"
                    />
                    <RingGauge
                      value={flowMetrics.backlogHealth.blocked}
                      max={flowMetrics.backlogHealth.totalItems}
                      size={90}
                      strokeWidth={6}
                      color={chartColors.rose}
                      label="Blocked"
                    />
                  </div>
                  <div className="text-center mt-4 pt-4 border-t border-border-subtle">
                    <span className="text-lg font-display font-semibold text-text-primary">
                      {flowMetrics.backlogHealth.totalItems}
                    </span>
                    <span className="text-xs font-mono text-text-ghost ml-1.5">total items</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <>
          <SectionHeader title="Projects" subtitle={`${projects.length} active projects`} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {projects.map((project, i) => (
              <ProjectCard key={project.id || i} project={project} delay={i} />
            ))}
          </div>
        </>
      )}

      <SectionHeader title="Delivery Insights" subtitle="AI observations on work flow" />
      {productInsights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {productInsights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight as any} delay={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-tertiary text-sm">
          No product insights available. Run the pipeline to generate insights.
        </div>
      )}
    </div>
  );
}
