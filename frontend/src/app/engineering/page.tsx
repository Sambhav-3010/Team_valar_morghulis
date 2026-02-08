'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { InsightCard } from '@/components/ai/InsightCard';
import { InsightStream } from '@/components/ai/InsightStream';
import { TrendChart } from '@/components/charts/TrendChart';
import { fetchEngineeringData, fetchTechOverview, type Insight } from '@/lib/api';
import { Rocket, Clock, AlertTriangle, Wrench, Loader2, RefreshCw } from 'lucide-react';
import { useChartColors } from '@/hooks/useThemeColors';

const defaultMetrics = {
  deploymentFrequency: { current: 0, previous: 0, unit: '/day', rating: 'Low', trend: [] },
  leadTime: { current: 0, previous: 0, unit: 'hours', rating: 'Low', trend: [] },
  changeFailureRate: { current: 0, previous: 0, unit: '%', rating: 'Low', trend: [] },
  mttr: { current: 0, previous: 0, unit: 'hours', rating: 'Low', trend: [] },
};

export default function EngineeringPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [doraMetrics, setDoraMetrics] = useState<any>(defaultMetrics);
  const [techOverview, setTechOverview] = useState<any>(null);
  const chartColors = useChartColors();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const engData = await fetchEngineeringData();
      setInsights(engData?.insights || []);
      if (engData?.metrics) {
        setDoraMetrics(engData.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch engineering data:', err);
      setError('Failed to connect to backend. Make sure the server is running.');
    }

    try {
      const techData = await fetchTechOverview();
      if (techData?.overview) {
        setTechOverview(techData.overview);
      }
    } catch (err) {
      console.error('Failed to fetch tech overview:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const engInsights = insights.filter(i => i.persona === 'engineering' || i.persona === 'all');

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
          title="Engineering Health"
          description="Monitor software delivery performance through DORA metrics."
          badge={{ label: 'DORA', color: 'text-cyan bg-cyan-dim' }}
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
        title="Engineering Health"
        description="Monitor software delivery performance through DORA metrics. Understand deployment cadence, lead times, reliability, and recovery capabilities."
        badge={{ label: 'DORA', color: 'text-cyan bg-cyan-dim' }}
      />

      <div className="mb-10">
        <InsightStream
          message={`Fetched ${engInsights.length} engineering insights from backend.`}
          typing
        />
      </div>

      <SectionHeader title="DORA Metrics" subtitle="Software delivery performance indicators" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {doraCards.map((card, i) => {
          const metric = doraMetrics[card.key] || {};
          return (
            <MetricCard
              key={card.key}
              label={card.label}
              value={metric.current || 0}
              unit={metric.unit || ''}
              current={metric.current || 0}
              previous={metric.previous || 0}
              rating={metric.rating}
              icon={card.icon}
              accentColor={card.accentColor}
              delay={i}
            />
          );
        })}
      </div>

      {doraMetrics.deploymentFrequency?.trend?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {doraCards.map((card, i) => {
            const metric = doraMetrics[card.key];
            if (!metric?.trend?.length) return null;
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
      )}

      <SectionHeader title="Engineering Insights" subtitle="AI observations on delivery health" />
      {engInsights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {engInsights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight as any} delay={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-tertiary text-sm">
          No engineering insights available. Run the pipeline to generate insights.
        </div>
      )}
    </div>
  );
}
