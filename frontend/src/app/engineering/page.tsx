'use client';

import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { InsightCard } from '@/components/ai/InsightCard';
import { InsightStream } from '@/components/ai/InsightStream';
import { TrendChart } from '@/components/charts/TrendChart';
import { SparkLine } from '@/components/charts/SparkLine';
import { doraMetrics, aiInsights, projects } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Rocket, Clock, AlertTriangle, Wrench } from 'lucide-react';
import { useChartColors, useHealthColor } from '@/hooks/useThemeColors';

export default function EngineeringPage() {
  const engInsights = aiInsights.filter(i => i.persona === 'engineering' || i.persona === 'all');
  const chartColors = useChartColors();

  const doraCards = [
    {
      key: 'deploymentFrequency',
      label: 'Deployment Frequency',
      icon: <Rocket className="w-4 h-4 text-emerald" />,
      accentColor: 'bg-emerald-dim',
      chartColor: chartColors.emerald,
    },
    {
      key: 'leadTime',
      label: 'Lead Time for Changes',
      icon: <Clock className="w-4 h-4 text-cyan" />,
      accentColor: 'bg-cyan-dim',
      chartColor: chartColors.cyan,
    },
    {
      key: 'changeFailureRate',
      label: 'Change Failure Rate',
      icon: <AlertTriangle className="w-4 h-4 text-accent" />,
      accentColor: 'bg-accent-dim',
      chartColor: chartColors.accent,
    },
    {
      key: 'mttr',
      label: 'Mean Time to Recovery',
      icon: <Wrench className="w-4 h-4 text-violet" />,
      accentColor: 'bg-violet-dim',
      chartColor: chartColors.violet,
    },
  ] as const;

  const teamRows = [
    { team: 'Platform', df: '5.1/day', lt: '14.2h', cfr: '2.8%', mttr: '0.9h', color: chartColors.emerald },
    { team: 'Backend', df: '4.8/day', lt: '12.5h', cfr: '1.9%', mttr: '1.1h', color: chartColors.emerald },
    { team: 'Frontend', df: '3.2/day', lt: '24.1h', cfr: '7.8%', mttr: '2.4h', color: chartColors.accent },
    { team: 'Infrastructure', df: '2.1/day', lt: '18.8h', cfr: '3.5%', mttr: '1.2h', color: chartColors.cyan },
    { team: 'Growth', df: '1.8/day', lt: '28.3h', cfr: '4.2%', mttr: '3.1h', color: chartColors.accent },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Engineering Health"
        description="Monitor software delivery performance through DORA metrics. Understand deployment cadence, lead times, reliability, and recovery capabilities."
        badge={{ label: 'DORA', color: 'text-cyan bg-cyan-dim' }}
      />

      {/* AI Summary */}
      <div className="mb-10">
        <InsightStream
          message="Engineering performance is strong this period. Your deployment frequency classifies as Elite (4.2/day) and change failure rate has improved to 3.2%. The Backend team's shift to smaller PRs has meaningfully reduced lead times. One area to watch: the Frontend team's failure rate spiked during Dashboard V3 integration."
          typing
        />
      </div>

      {/* ── DORA Metric Cards ── */}
      <SectionHeader title="DORA Metrics" subtitle="Software delivery performance indicators" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {doraCards.map((card, i) => {
          const metric = doraMetrics[card.key];
          return (
            <MetricCard
              key={card.key}
              label={card.label}
              value={metric.current}
              unit={metric.unit}
              current={metric.current}
              previous={metric.previous}
              rating={metric.rating}
              icon={card.icon}
              accentColor={card.accentColor}
              delay={i}
            />
          );
        })}
      </div>

      {/* ── Trend Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {doraCards.map((card, i) => {
          const metric = doraMetrics[card.key];
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-display font-medium text-text-primary">{card.label}</h3>
                    <p className="text-xs text-text-ghost font-mono mt-0.5">30-day trend</p>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-display font-semibold text-text-primary">
                      {metric.current}
                    </span>
                    <span className="text-xs font-mono text-text-ghost">{metric.unit}</span>
                  </div>
                </div>
                <TrendChart
                  data={metric.trend}
                  color={card.chartColor}
                  height={180}
                  gradientId={card.key}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Team Breakdown ── */}
      <SectionHeader title="Team Performance" subtitle="DORA metrics by team" />

      <div className="card p-6 mb-12">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left text-[10px] font-mono uppercase tracking-wider text-text-ghost pb-3 pr-8">Team</th>
                <th className="text-left text-[10px] font-mono uppercase tracking-wider text-text-ghost pb-3 pr-8">Deploy Freq</th>
                <th className="text-left text-[10px] font-mono uppercase tracking-wider text-text-ghost pb-3 pr-8">Lead Time</th>
                <th className="text-left text-[10px] font-mono uppercase tracking-wider text-text-ghost pb-3 pr-8">Failure Rate</th>
                <th className="text-left text-[10px] font-mono uppercase tracking-wider text-text-ghost pb-3">MTTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {teamRows.map((row, i) => (
                <motion.tr
                  key={row.team}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="group hover:bg-surface-2/30 transition-colors"
                >
                  <td className="py-3.5 pr-8">
                    <span className="text-sm font-display font-medium text-text-primary">{row.team}</span>
                  </td>
                  <td className="py-3.5 pr-8">
                    <span className="text-sm font-mono text-text-secondary">{row.df}</span>
                  </td>
                  <td className="py-3.5 pr-8">
                    <span className="text-sm font-mono text-text-secondary">{row.lt}</span>
                  </td>
                  <td className="py-3.5 pr-8">
                    <span className="text-sm font-mono" style={{ color: row.color }}>{row.cfr}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-sm font-mono text-text-secondary">{row.mttr}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Engineering Insights ── */}
      <SectionHeader title="Engineering Insights" subtitle="AI observations on delivery health" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {engInsights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} delay={i} />
        ))}
      </div>
    </div>
  );
}
