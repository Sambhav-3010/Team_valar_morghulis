'use client';

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
import { flowMetrics, projects, aiInsights } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Gauge, Timer, Layers, Activity } from 'lucide-react';
import { useChartColors } from '@/hooks/useThemeColors';

export default function ProductPage() {
  const productInsights = aiInsights.filter(i => i.persona === 'product' || i.persona === 'all');
  const chartColors = useChartColors();

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Product Delivery"
        description="Track delivery confidence, backlog health, and work distribution through the FLOW framework. Understand how work moves through your system."
        badge={{ label: 'FLOW', color: 'text-accent bg-accent-dim' }}
      />

      {/* AI Summary */}
      <div className="mb-10">
        <InsightStream
          message="Flow velocity improved to 42 items/sprint, up from 38 last period. Efficiency gains are real — flow time dropped to 5.2 days. However, the Mobile App MVP remains a concern with increasing WIP and blocked items. The Search Overhaul project has doubled its blocked item count, mostly due to unresolved API contract decisions."
          typing
        />
      </div>

      {/* ── FLOW Metric Cards ── */}
      <SectionHeader title="FLOW Metrics" subtitle="Work delivery performance indicators" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <MetricCard
          label="Flow Velocity"
          value={flowMetrics.flowVelocity.current}
          unit={flowMetrics.flowVelocity.unit}
          current={flowMetrics.flowVelocity.current}
          previous={flowMetrics.flowVelocity.previous}
          delay={0}
          icon={<Gauge className="w-4 h-4 text-cyan" />}
          accentColor="bg-cyan-dim"
        />
        <MetricCard
          label="Flow Efficiency"
          value={flowMetrics.flowEfficiency.current}
          unit={flowMetrics.flowEfficiency.unit}
          current={flowMetrics.flowEfficiency.current}
          previous={flowMetrics.flowEfficiency.previous}
          delay={1}
          icon={<Activity className="w-4 h-4 text-emerald" />}
          accentColor="bg-emerald-dim"
        />
        <MetricCard
          label="Flow Time"
          value={flowMetrics.flowTime.current}
          unit={flowMetrics.flowTime.unit}
          current={flowMetrics.flowTime.current}
          previous={flowMetrics.flowTime.previous}
          delay={2}
          icon={<Timer className="w-4 h-4 text-accent" />}
          accentColor="bg-accent-dim"
        />
        <MetricCard
          label="Flow Load"
          value={flowMetrics.flowLoad.current}
          unit={flowMetrics.flowLoad.unit}
          current={flowMetrics.flowLoad.current}
          previous={flowMetrics.flowLoad.previous}
          delay={3}
          icon={<Layers className="w-4 h-4 text-violet" />}
          accentColor="bg-violet-dim"
        />
      </div>

      {/* ── Two column: Trends + Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Velocity Trend */}
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

        {/* Work Distribution + Backlog */}
        <div className="space-y-6">
          <div>
            <SectionHeader title="Work Distribution" subtitle="By item type" />
            <div className="card p-5">
              <DistributionBar segments={flowMetrics.flowDistribution} />
            </div>
          </div>

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
        </div>
      </div>

      {/* ── More Trend Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <SectionHeader title="Flow Efficiency" subtitle="Active time vs wait time" />
          <div className="card p-5">
            <TrendChart
              data={flowMetrics.flowEfficiency.trend}
              color={chartColors.emerald}
              height={200}
              gradientId="flowEfficiency"
            />
          </div>
        </div>
        <div>
          <SectionHeader title="Flow Time" subtitle="End-to-end delivery duration" />
          <div className="card p-5">
            <TrendChart
              data={flowMetrics.flowTime.trend}
              color={chartColors.accent}
              height={200}
              gradientId="flowTime"
            />
          </div>
        </div>
      </div>

      {/* ── Projects ── */}
      <SectionHeader title="Projects" subtitle={`${projects.length} active projects`} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} delay={i} />
        ))}
      </div>

      {/* ── Product Insights ── */}
      <SectionHeader title="Delivery Insights" subtitle="AI observations on work flow" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productInsights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} delay={i} />
        ))}
      </div>
    </div>
  );
}
