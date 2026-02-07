'use client';

import { motion } from 'framer-motion';
import { Rocket, GitPullRequest, IterationCcw, AlertCircle, Sparkles, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  deploy: { icon: Rocket, color: 'text-emerald' },
  pr: { icon: GitPullRequest, color: 'text-cyan' },
  sprint: { icon: IterationCcw, color: 'text-accent' },
  alert: { icon: AlertCircle, color: 'text-rose' },
  insight: { icon: Sparkles, color: 'text-violet' },
  milestone: { icon: Flag, color: 'text-blue' },
};

interface ActivityItemProps {
  item: {
    id: string;
    type: string;
    message: string;
    team: string;
    time: string;
    source: string;
  };
  delay?: number;
}

export function ActivityItem({ item, delay = 0 }: ActivityItemProps) {
  const config = typeConfig[item.type] || typeConfig.deploy;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-start gap-3 py-3 group"
    >
      <div className="mt-0.5 flex-shrink-0">
        <div className={cn('w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center border border-border-subtle')}>
          <Icon className={cn('w-3.5 h-3.5', config.color)} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-secondary leading-snug group-hover:text-text-primary transition-colors">
          {item.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-text-ghost">{item.team}</span>
          <span className="text-text-ghost">·</span>
          <span className="text-[10px] font-mono text-text-ghost">{item.time}</span>
          <span className="text-text-ghost">·</span>
          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-2 text-text-ghost">
            {item.source}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
