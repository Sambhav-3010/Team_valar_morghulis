'use client';

import { motion } from 'framer-motion';
import {
  Users,
  FolderKanban,
  Plug,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { InsightCard } from '@/components/ai/InsightCard';
import { InsightStream } from '@/components/ai/InsightStream';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { ActivityItem } from '@/components/cards/ActivityItem';
import { SparkLine } from '@/components/charts/SparkLine';
import {
  orgSummary,
  projects,
  aiInsights,
  activityFeed,
  doraMetrics,
  flowMetrics,
  spaceMetrics,
} from '@/data/mock';

const personaCards = [
  {
    href: '/hr',
    label: 'People & Culture',
    framework: 'SPACE',
    description: 'Wellbeing, collaboration, and activity balance',
    color: 'from-violet/20 to-violet/5',
    borderColor: 'hover:border-violet/30',
    icon: '👥',
    stat: `${spaceMetrics.satisfaction.current}/10`,
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
    stat: `${doraMetrics.deploymentFrequency.current}`,
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
    stat: `${flowMetrics.flowVelocity.current}`,
    statLabel: 'Items/sprint',
  },
];

export default function OverviewPage() {
  const topInsights = aiInsights.filter(i => i.persona === 'all' || i.confidence > 0.75).slice(0, 3);

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Overview"
        description="A unified view across your people, projects, and engineering health. AI insights surface what needs your attention."
      />

      {/* ── AI Summary Stream ── */}
      <div className="mb-10">
        <InsightStream
          message="This week shows strong momentum. Deployment frequency hit a new high at 4.2/day with no proportional increase in failures. However, the Mobile App MVP continues to fall behind schedule, and Nina Okafor on Infrastructure may benefit from a check-in — her collaboration patterns have shifted notably."
          typing
        />
      </div>

      {/* ── Persona Lenses ── */}
      <SectionHeader
        title="Lenses"
        subtitle="Choose a perspective to explore your data"
      />

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

      {/* ── Quick Metrics ── */}
      <SectionHeader title="Organization Pulse" subtitle="Key metrics at a glance" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <MetricCard
          label="People"
          value={orgSummary.totalPeople}
          unit="tracked"
          delay={0}
          icon={<Users className="w-4 h-4 text-violet" />}
          accentColor="bg-violet-dim"
        />
        <MetricCard
          label="Projects"
          value={orgSummary.totalProjects}
          unit="active"
          delay={1}
          icon={<FolderKanban className="w-4 h-4 text-cyan" />}
          accentColor="bg-cyan-dim"
        />
        <MetricCard
          label="Integrations"
          value={orgSummary.activeIntegrations}
          unit="connected"
          delay={2}
          icon={<Plug className="w-4 h-4 text-emerald" />}
          accentColor="bg-emerald-dim"
        />
        <MetricCard
          label="AI Insights"
          value={orgSummary.insightsGenerated}
          unit="this week"
          delay={3}
          icon={<Sparkles className="w-4 h-4 text-accent" />}
          accentColor="bg-accent-dim"
        />
      </div>

      {/* ── Two-column: Projects + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
        {/* Projects */}
        <div className="lg:col-span-3">
          <SectionHeader
            title="Projects"
            subtitle={`${projects.filter(p => p.status === 'on-track').length} on track · ${projects.filter(p => p.status === 'at-risk').length} at risk`}
            action={
              <Link href="/product" className="text-xs text-accent hover:text-accent/80 transition-colors font-medium">
                View all →
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((project, i) => (
              <ProjectCard key={project.id} project={project} delay={i} />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <SectionHeader title="Recent Activity" subtitle="Live feed from all sources" />
          <div className="card p-5">
            <div className="divide-y divide-border-subtle">
              {activityFeed.map((item, i) => (
                <ActivityItem key={item.id} item={item} delay={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Insights ── */}
      <SectionHeader
        title="Recent Insights"
        subtitle="AI-generated observations from your data"
        action={
          <Link href="/insights" className="text-xs text-accent hover:text-accent/80 transition-colors font-medium">
            View all →
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topInsights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} delay={i} />
        ))}
      </div>
    </div>
  );
}
