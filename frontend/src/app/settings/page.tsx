'use client';

import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { integrations } from '@/data/mock';
import { cn, formatNumber } from '@/lib/utils';
import {
  Github,
  Kanban,
  MessageSquare,
  Mail,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Bell,
  Users,
  Database,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  github: Github,
  kanban: Kanban,
  'message-square': MessageSquare,
  mail: Mail,
};

const statusConfig = {
  connected: { label: 'Connected', icon: Check, color: 'text-emerald', bg: 'bg-emerald-dim' },
  syncing: { label: 'Syncing', icon: Loader2, color: 'text-cyan', bg: 'bg-cyan-dim' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-rose', bg: 'bg-rose-dim' },
  disconnected: { label: 'Disconnected', icon: AlertCircle, color: 'text-text-ghost', bg: 'bg-surface-3' },
};

export default function SettingsPage() {
  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your data sources, team configuration, and platform preferences."
      />

      {/* ── Integrations ── */}
      <SectionHeader title="Data Sources" subtitle="Connected tools and sync status" />

      <div className="space-y-3 mb-12">
        {integrations.map((integration, i) => {
          const Icon = iconMap[integration.icon] || Mail;
          const status = statusConfig[integration.status];
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center">
                    <Icon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-medium text-text-primary">{integration.name}</h3>
                    <p className="text-xs text-text-ghost font-mono mt-0.5">
                      {formatNumber(integration.recordCount)} records synced
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    status.color,
                    status.bg,
                  )}>
                    <StatusIcon className={cn(
                      'w-3 h-3',
                      integration.status === 'syncing' && 'animate-spin',
                    )} />
                    {status.label}
                  </div>

                  <span className="text-xs text-text-ghost font-mono">{integration.lastSync}</span>

                  <button className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Preferences sections ── */}
      {[
        {
          title: 'Team Configuration',
          subtitle: 'Manage team structure and members',
          icon: Users,
          items: [
            { label: 'Team Members', description: '8 people tracked across 5 teams', action: 'Manage' },
            { label: 'Email Identity Mapping', description: 'Unified identity resolution across tools', action: 'Configure' },
            { label: 'Project Grouping', description: '6 active projects mapped to teams', action: 'Edit' },
          ],
        },
        {
          title: 'AI & Insights',
          subtitle: 'Configure how AI generates insights',
          icon: Database,
          items: [
            { label: 'Insight Sensitivity', description: 'Controls how aggressively anomalies are detected', action: 'Adjust' },
            { label: 'Data Retention', description: '90 days of historical analysis', action: 'Change' },
            { label: 'Framework Weights', description: 'Customize DORA, FLOW, SPACE metric weights', action: 'Configure' },
          ],
        },
        {
          title: 'Notifications',
          subtitle: 'What triggers alerts and summaries',
          icon: Bell,
          items: [
            { label: 'Weekly Digest', description: 'Sent every Monday at 9:00 AM', action: 'Edit' },
            { label: 'Anomaly Alerts', description: 'Real-time alerts for significant deviations', action: 'Configure' },
            { label: 'Insight Summaries', description: 'Daily AI summary of key observations', action: 'Toggle' },
          ],
        },
        {
          title: 'Security & Access',
          subtitle: 'Authentication and permissions',
          icon: Shield,
          items: [
            { label: 'SSO Configuration', description: 'SAML 2.0 · Okta connected', action: 'Manage' },
            { label: 'Role-Based Access', description: '3 roles: Admin, Manager, Viewer', action: 'Edit' },
            { label: 'Audit Log', description: '1,247 events in the last 30 days', action: 'View' },
          ],
        },
      ].map((section, sectionIndex) => {
        const SectionIcon = section.icon;

        return (
          <div key={section.title} className="mb-10">
            <SectionHeader title={section.title} subtitle={section.subtitle} />

            <div className="card divide-y divide-border-subtle">
              {section.items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (sectionIndex * 3 + i) * 0.04 }}
                  className="flex items-center justify-between p-5 hover:bg-surface-2/30 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-display font-medium text-text-primary">{item.label}</h4>
                    <p className="text-xs text-text-ghost mt-0.5">{item.description}</p>
                  </div>
                  <button className="text-xs font-medium text-accent hover:text-accent/80 transition-colors px-3 py-1.5 rounded-lg border border-accent/20 hover:border-accent/40 hover:bg-accent-dim">
                    {item.action}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
