'use client';

import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { PersonCard } from '@/components/cards/PersonCard';
import { InsightCard } from '@/components/ai/InsightCard';
import { InsightStream } from '@/components/ai/InsightStream';
import { TrendChart } from '@/components/charts/TrendChart';
import { RingGauge } from '@/components/charts/RingGauge';
import { spaceMetrics, people, aiInsights } from '@/data/mock';
import { cn } from '@/lib/utils';
import { useChartColors, useHealthColor } from '@/hooks/useThemeColors';

const wellbeingColors: Record<string, { color: string; bg: string }> = {
  balanced: { color: 'text-emerald', bg: 'bg-emerald-dim' },
  high: { color: 'text-cyan', bg: 'bg-cyan-dim' },
  low: { color: 'text-accent', bg: 'bg-accent-dim' },
  overloaded: { color: 'text-rose', bg: 'bg-rose-dim' },
};

export default function HRPage() {
  const hrInsights = aiInsights.filter(i => i.persona === 'hr' || i.persona === 'all');
  const chartColors = useChartColors();

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="People & Culture"
        description="Understand team dynamics, collaboration health, and wellbeing signals using the SPACE framework. These insights are designed to support, not evaluate."
        badge={{ label: 'SPACE', color: 'text-violet bg-violet-dim' }}
      />

      {/* AI Summary */}
      <div className="mb-10">
        <InsightStream
          message="Overall team satisfaction is trending upward at 7.8/10 this period. Most team members show balanced activity patterns, though two individuals — Alex Rivera and Nina Okafor — are showing signs of sustained overload. Cross-team collaboration remains strongest between Backend and Infrastructure."
          typing
        />
      </div>

      {/* ── SPACE Dimensions ── */}
      <SectionHeader title="SPACE Dimensions" subtitle="Five pillars of developer experience" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <MetricCard
          label="Satisfaction"
          value={spaceMetrics.satisfaction.current}
          unit="/10"
          current={spaceMetrics.satisfaction.current}
          previous={spaceMetrics.satisfaction.previous}
          delay={0}
        />
        <MetricCard
          label="Performance"
          value={spaceMetrics.performance.current}
          unit="%"
          current={spaceMetrics.performance.current}
          previous={spaceMetrics.performance.previous}
          delay={1}
        />
        <MetricCard
          label="Activity"
          value={spaceMetrics.activity.current}
          unit="%"
          current={spaceMetrics.activity.current}
          previous={spaceMetrics.activity.previous}
          delay={2}
        />
        <MetricCard
          label="Communication"
          value={spaceMetrics.communication.current}
          unit="%"
          current={spaceMetrics.communication.current}
          previous={spaceMetrics.communication.previous}
          delay={3}
        />
        <MetricCard
          label="Efficiency"
          value={spaceMetrics.efficiency.current}
          unit="%"
          current={spaceMetrics.efficiency.current}
          previous={spaceMetrics.efficiency.previous}
          delay={4}
        />
      </div>

      {/* ── Two column: Trends + Wellbeing ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Satisfaction trend */}
        <div className="lg:col-span-2">
          <SectionHeader title="Satisfaction Trend" subtitle="12-period rolling average" />
          <div className="card p-5">
            <TrendChart
              data={spaceMetrics.satisfaction.trend}
              color={chartColors.violet}
              height={260}
              gradientId="satisfaction"
            />
          </div>
        </div>

        {/* Wellbeing distribution */}
        <div>
          <SectionHeader title="Team Wellbeing" subtitle="Activity distribution" />
          <div className="card p-6">
            <div className="space-y-4">
              {Object.entries(spaceMetrics.teamWellbeing).map(([key, count]) => {
                const config = wellbeingColors[key];
                const total = Object.values(spaceMetrics.teamWellbeing).reduce((a, b) => a + b, 0);
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn('text-xs font-medium capitalize', config.color)}>
                        {key}
                      </span>
                      <span className="text-xs font-mono text-text-ghost">
                        {count} people · {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className={cn('h-full rounded-full', config.bg.replace('-dim', ''))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ring gauges */}
            <div className="flex justify-around mt-8 pt-6 border-t border-border-subtle">
              <RingGauge
                value={spaceMetrics.communication.current}
                max={100}
                size={80}
                strokeWidth={6}
                color={chartColors.violet}
                label="Collab"
              />
              <RingGauge
                value={spaceMetrics.efficiency.current}
                max={100}
                size={80}
                strokeWidth={6}
                color={chartColors.cyan}
                label="Efficiency"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Collaboration Network ── */}
      <SectionHeader title="Collaboration Network" subtitle="Inter-team communication strength" />
      <div className="card p-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {spaceMetrics.collaborationNetwork.map((link, i) => {
            const strength = Math.round(link.strength * 100);
            const color = strength >= 80 ? chartColors.emerald : strength >= 60 ? chartColors.accent : chartColors.rose;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-4 rounded-lg bg-surface-2/50 border border-border-subtle"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-text-secondary">{link.from}</span>
                  <span className="text-text-ghost">&rarr;</span>
                  <span className="text-xs font-mono text-text-secondary">{link.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${strength}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 + 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs font-mono" style={{ color }}>{strength}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── People ── */}
      <SectionHeader title="People" subtitle={`${people.length} team members tracked`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {people.map((person, i) => (
          <PersonCard key={person.id} person={person} delay={i} />
        ))}
      </div>

      {/* ── AI Insights ── */}
      <SectionHeader title="People Insights" subtitle="AI observations on team dynamics" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hrInsights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} delay={i} />
        ))}
      </div>
    </div>
  );
}
