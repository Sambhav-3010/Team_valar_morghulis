'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FolderKanban,
  Plug,
  Sparkles,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { InsightCard } from '@/components/ai/InsightCard';
import { InsightStream } from '@/components/ai/InsightStream';
import { fetchHRData, fetchProductData, fetchEngineeringData, fetchInsights, type Insight } from '@/lib/api';

interface MetricsData {
  space: {
    satisfaction: number;
    performance: number;
    activity: number;
  };
  flow: {
    velocity: number;
    efficiency: number;
    time: number;
  };
  dora: {
    deploymentFrequency: number;
    leadTime: number;
    changeFailureRate: number;
  };
}

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    space: { satisfaction: 0, performance: 0, activity: 0 },
    flow: { velocity: 0, efficiency: 0, time: 0 },
    dora: { deploymentFrequency: 0, leadTime: 0, changeFailureRate: 0 },
  });
  const [insightCount, setInsightCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        const hrData = await fetchHRData();
        if (hrData?.metrics) {
          setMetrics(prev => ({
            ...prev,
            space: {
              satisfaction: hrData.metrics.satisfaction?.current || 0,
              performance: hrData.metrics.performance?.current || 0,
              activity: hrData.metrics.activity?.current || 0,
            }
          }));
        }
      } catch (err) {
        console.error('Failed to fetch HR data:', err);
      }

      try {
        const productData = await fetchProductData();
        if (productData?.metrics) {
          setMetrics(prev => ({
            ...prev,
            flow: {
              velocity: productData.metrics.flowVelocity?.current || 0,
              efficiency: productData.metrics.flowEfficiency?.current || 0,
              time: productData.metrics.flowTime?.current || 0,
            }
          }));
        }
      } catch (err) {
        console.error('Failed to fetch product data:', err);
      }

      try {
        const engData = await fetchEngineeringData();
        if (engData?.metrics) {
          setMetrics(prev => ({
            ...prev,
            dora: {
              deploymentFrequency: engData.metrics.deploymentFrequency?.current || 0,
              leadTime: engData.metrics.leadTime?.current || 0,
              changeFailureRate: engData.metrics.changeFailureRate?.current || 0,
            }
          }));
        }
      } catch (err) {
        console.error('Failed to fetch engineering data:', err);
      }

      try {
        const allInsights = await fetchInsights(undefined, 10);
        setInsights(allInsights.slice(0, 3));
        setInsightCount(allInsights.length);
      } catch (err) {
        console.error('Failed to fetch insights:', err);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const personaCards = [
    {
      href: '/hr',
      label: 'People & Culture',
      framework: 'SPACE',
      description: 'Wellbeing, collaboration, and activity balance',
      color: 'from-violet/20 to-violet/5',
      borderColor: 'hover:border-violet/30',
      icon: '👥',
      stat: `${metrics.space.satisfaction}/10`,
      statLabel: 'Satisfaction',
    },
    {
      href: '/engineering',
      label: 'Engineering',
      framework: 'DORA',
      description: 'Deployment frequency, lead time, reliability',
      color: 'from-cyan/20 to-cyan/5',
      borderColor: 'hover:border-cyan/30',
      icon: '⚡',
      stat: `${metrics.dora.deploymentFrequency}`,
      statLabel: 'Deploys/day',
    },
    {
      href: '/product',
      label: 'Product',
      framework: 'FLOW',
      description: 'Velocity, efficiency, delivery confidence',
      color: 'from-accent/20 to-accent/5',
      borderColor: 'hover:border-accent/30',
      icon: '📦',
      stat: `${metrics.flow.velocity}`,
      statLabel: 'Items/sprint',
    },
  ];

  const summaryMessage = loading
    ? 'Loading organization data...'
    : `Organization overview: ${metrics.space.satisfaction}/10 satisfaction score, ${metrics.dora.deploymentFrequency} deploys/day, and ${metrics.flow.velocity} items delivered per sprint. ${insightCount > 0 ? `${insightCount} AI insights generated.` : ''}`;

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Overview"
        description="A unified view across your people, projects, and engineering health. AI insights surface what needs your attention."
      />

      <div className="mb-10">
        <InsightStream message={summaryMessage} typing />
      </div>

      <SectionHeader
        title="Lenses"
        subtitle="Choose a perspective to explore your data"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {personaCards.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <Link href={card.href} className="block group">
                <div className={cn(
                  'card card-interactive p-6 bg-gradient-to-br',
                  card.color,
                  card.borderColor,
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-2xl">{card.icon}</span>
                      <h3 className="text-base font-display font-semibold text-text-primary mt-2">
                        {card.label}
                      </h3>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-text-ghost">
                        {card.framework} Framework
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-text-ghost group-hover:text-text-secondary transition-colors" />
                  </div>
                  <p className="text-sm text-text-secondary mb-4">{card.description}</p>
                  <div className="flex items-baseline gap-1.5 pt-3 border-t border-border-subtle">
                    <span className="text-xl font-display font-semibold text-text-primary">{card.stat}</span>
                    <span className="text-xs text-text-ghost font-mono">{card.statLabel}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <SectionHeader title="Key Metrics" subtitle="Real-time data from backend" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <MetricCard
          label="Satisfaction"
          value={metrics.space.satisfaction}
          unit="/10"
          delay={0}
          icon={<Users className="w-4 h-4 text-violet" />}
          accentColor="bg-violet-dim"
        />
        <MetricCard
          label="Deploy Freq"
          value={metrics.dora.deploymentFrequency}
          unit="/day"
          delay={1}
          icon={<FolderKanban className="w-4 h-4 text-cyan" />}
          accentColor="bg-cyan-dim"
        />
        <MetricCard
          label="Flow Velocity"
          value={metrics.flow.velocity}
          unit="items"
          delay={2}
          icon={<Plug className="w-4 h-4 text-emerald" />}
          accentColor="bg-emerald-dim"
        />
        <MetricCard
          label="AI Insights"
          value={insightCount}
          unit="generated"
          delay={3}
          icon={<Sparkles className="w-4 h-4 text-accent" />}
          accentColor="bg-accent-dim"
        />
      </div>

      <SectionHeader
        title="Recent Insights"
        subtitle="AI-generated observations from your data"
        action={
          <Link href="/insights" className="text-xs text-accent hover:text-accent/80 transition-colors font-medium">
            View all →
          </Link>
        }
      />

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight as any} delay={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-tertiary text-sm">
          No insights available. Run the pipeline to generate insights.
        </div>
      )}
    </div>
  );
}
