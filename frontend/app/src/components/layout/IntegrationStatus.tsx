'use client';

import { integrations } from '@/data/mock';
import { Github, Kanban, MessageSquare, Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  github: Github,
  kanban: Kanban,
  'message-square': MessageSquare,
  mail: Mail,
};

const statusColors: Record<string, string> = {
  connected: 'text-emerald',
  syncing: 'text-cyan',
  error: 'text-rose',
  disconnected: 'text-text-ghost',
};

export function IntegrationStatus() {
  return (
    <div className="px-4 py-3 border-t border-border-subtle">
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-ghost mb-3">
        Data Sources
      </p>
      <div className="flex gap-3">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.icon] || Mail;
          const isSyncing = integration.status === 'syncing';

          return (
            <div
              key={integration.name}
              className="group relative flex flex-col items-center"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  'bg-surface-2 border border-border-subtle',
                  'transition-all duration-200',
                  'group-hover:border-border-default group-hover:bg-surface-3',
                )}
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan animate-spin" />
                ) : (
                  <Icon className={cn('w-3.5 h-3.5', statusColors[integration.status])} />
                )}
              </div>
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5',
                  integration.status === 'connected' && 'bg-emerald',
                  integration.status === 'syncing' && 'bg-cyan pulse-soft',
                  integration.status === 'error' && 'bg-rose',
                  integration.status === 'disconnected' && 'bg-text-ghost',
                )}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
                <div className="tooltip-content whitespace-nowrap">
                  <span className="font-medium text-text-primary">{integration.name}</span>
                  <span className="mx-1.5 text-text-ghost">·</span>
                  <span>{integration.lastSync}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
