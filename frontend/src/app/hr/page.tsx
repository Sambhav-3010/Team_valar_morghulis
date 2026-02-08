'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { PersonCard } from '@/components/cards/PersonCard';
import { InsightCard } from '@/components/ai/InsightCard';
import { InsightStream } from '@/components/ai/InsightStream';
import { TrendChart } from '@/components/charts/TrendChart';
import { RingGauge } from '@/components/charts/RingGauge';
import { fetchHRData, fetchEmployees, fetchIdentities, type Insight } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useChartColors } from '@/hooks/useThemeColors';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const wellbeingColors: Record<string, { color: string; bg: string }> = {
  balanced: { color: 'text-emerald', bg: 'bg-emerald-dim' },
  high: { color: 'text-cyan', bg: 'bg-cyan-dim' },
  low: { color: 'text-accent', bg: 'bg-accent-dim' },
  overloaded: { color: 'text-rose', bg: 'bg-rose-dim' },
};

const defaultMetrics = {
  satisfaction: { current: 0, previous: 0, trend: [] },
  performance: { current: 0, previous: 0, trend: [] },
  activity: { current: 0, previous: 0, trend: [] },
  communication: { current: 0, previous: 0, trend: [] },
  efficiency: { current: 0, previous: 0, trend: [] },
  teamWellbeing: { balanced: 0, high: 0, low: 0, overloaded: 0 },
  collaborationNetwork: [],
};

export default function HRPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [spaceMetrics, setSpaceMetrics] = useState<any>(defaultMetrics);
  const [people, setPeople] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const chartColors = useChartColors();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const hrData = await fetchHRData();
      setInsights(hrData?.insights || []);
      if (hrData?.metrics) {
        setSpaceMetrics(hrData.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch HR data:', err);
      setError('Failed to connect to backend. Make sure the server is running.');
    }

    let employeeActivityMap: Record<string, any> = {};
    try {
      const employeesData = await fetchEmployees();
      const employees = employeesData?.employees || [];
      employees.forEach((emp: any) => {
        const email = emp.email?.toLowerCase();
        if (email) {
          employeeActivityMap[email] = {
            totalActivities: emp.totalActivities || 0,
            completedTickets: emp.completedTickets || 0,
          };
        }
      });
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }

    try {
      const identitiesData = await fetchIdentities();
      const identitiesRaw = identitiesData?.identities || [];

      const enrichedPeople = identitiesRaw.map((identity: any, index: number) => {
        const email = identity.primaryEmail?.toLowerCase();
        const activity = employeeActivityMap[email] || { totalActivities: 0, completedTickets: 0 };

        const nameParts = (identity.displayName || email?.split('@')[0] || 'Unknown').split(' ');
        const initials = nameParts.slice(0, 2).map((p: string) => p[0]?.toUpperCase() || '').join('');

        const activityLevel = activity.totalActivities > 5 ? 'high' :
          activity.totalActivities > 2 ? 'balanced' :
            activity.totalActivities > 0 ? 'low' : 'balanced';

        return {
          id: identity._id || `identity-${index}`,
          name: identity.displayName || 'Unknown',
          email: identity.primaryEmail,
          role: identity.defaultProjectId ? 'Project Member' : 'Team Member',
          team: 'Organization',
          avatar: initials,
          spaceScore: Math.min(100, Math.max(20, 50 + activity.completedTickets * 10)),
          activityLevel: activityLevel,
          sources: [
            identity.githubLogin ? 'GitHub' : null,
            identity.slackUserId ? 'Slack' : null,
            identity.jiraAccountId ? 'Jira' : null,
          ].filter(Boolean),
        };
      });

      setPeople(enrichedPeople);
      setIdentities(identitiesRaw);
    } catch (err) {
      console.error('Failed to fetch identities:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const hrInsights = insights.filter(i => i.persona === 'hr' || i.persona === 'all');

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
          title="People & Culture"
          description="Understand team dynamics, collaboration health, and wellbeing signals using the SPACE framework."
          badge={{ label: 'SPACE', color: 'text-violet bg-violet-dim' }}
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
        title="People & Culture"
        description="Understand team dynamics, collaboration health, and wellbeing signals using the SPACE framework. These insights are designed to support, not evaluate."
        badge={{ label: 'SPACE', color: 'text-violet bg-violet-dim' }}
      />

      <div className="mb-10">
        <InsightStream
          message={`Fetched ${hrInsights.length} HR insights and ${people.length} team members from backend.`}
          typing
        />
      </div>

      <SectionHeader title="SPACE Dimensions" subtitle="Five pillars of developer experience" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <MetricCard
          label="Satisfaction"
          value={spaceMetrics.satisfaction?.current || 0}
          unit="/10"
          current={spaceMetrics.satisfaction?.current || 0}
          previous={spaceMetrics.satisfaction?.previous || 0}
          delay={0}
        />
        <MetricCard
          label="Performance"
          value={spaceMetrics.performance?.current || 0}
          unit="%"
          current={spaceMetrics.performance?.current || 0}
          previous={spaceMetrics.performance?.previous || 0}
          delay={1}
        />
        <MetricCard
          label="Activity"
          value={spaceMetrics.activity?.current || 0}
          unit="%"
          current={spaceMetrics.activity?.current || 0}
          previous={spaceMetrics.activity?.previous || 0}
          delay={2}
        />
        <MetricCard
          label="Communication"
          value={spaceMetrics.communication?.current || 0}
          unit="%"
          current={spaceMetrics.communication?.current || 0}
          previous={spaceMetrics.communication?.previous || 0}
          delay={3}
        />
        <MetricCard
          label="Efficiency"
          value={spaceMetrics.efficiency?.current || 0}
          unit="%"
          current={spaceMetrics.efficiency?.current || 0}
          previous={spaceMetrics.efficiency?.previous || 0}
          delay={4}
        />
      </div>

      {spaceMetrics.satisfaction?.trend?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
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

          <div>
            <SectionHeader title="Team Wellbeing" subtitle="Activity distribution" />
            <div className="card p-6">
              <div className="space-y-4">
                {Object.entries(spaceMetrics.teamWellbeing || {}).map(([key, count]) => {
                  const config = wellbeingColors[key];
                  if (!config) return null;
                  const total = Object.values(spaceMetrics.teamWellbeing || {}).reduce((a: any, b: any) => a + b, 0) as number;
                  const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;

                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn('text-xs font-medium capitalize', config.color)}>
                          {key}
                        </span>
                        <span className="text-xs font-mono text-text-ghost">
                          {count as number} people · {pct}%
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

              <div className="flex justify-around mt-8 pt-6 border-t border-border-subtle">
                <RingGauge
                  value={spaceMetrics.communication?.current || 0}
                  max={100}
                  size={80}
                  strokeWidth={6}
                  color={chartColors.violet}
                  label="Collab"
                />
                <RingGauge
                  value={spaceMetrics.efficiency?.current || 0}
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
      )}

      {spaceMetrics.collaborationNetwork?.length > 0 && (
        <>
          <SectionHeader title="Collaboration Network" subtitle="Inter-team communication strength" />
          <div className="card p-6 mb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {spaceMetrics.collaborationNetwork.map((link: any, i: number) => {
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
        </>
      )}



      {people.length > 0 && (
        <>
          <SectionHeader title="Team Members" subtitle={`${people.length} unified profiles with activity metrics`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {people.map((person: any, i: number) => (
              <PersonCard key={person.id || i} person={person} delay={i} />
            ))}
          </div>
        </>
      )}

      <SectionHeader title="People Insights" subtitle="AI observations on team dynamics" />
      {hrInsights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hrInsights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight as any} delay={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-tertiary text-sm">
          No HR insights available. Run the pipeline to generate insights.
        </div>
      )}
    </div>
  );
}
