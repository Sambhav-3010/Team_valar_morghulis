'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
}

const statusConfig = {
  'on-track': { label: 'On Track', dotColor: 'bg-emerald', textColor: 'text-emerald', bgColor: 'bg-emerald-dim' },
  'at-risk': { label: 'At Risk', dotColor: 'bg-accent', textColor: 'text-accent', bgColor: 'bg-accent-dim' },
  'behind': { label: 'Behind', dotColor: 'bg-rose', textColor: 'text-rose', bgColor: 'bg-rose-dim' },
  'completed': { label: 'Completed', dotColor: 'bg-cyan', textColor: 'text-cyan', bgColor: 'bg-cyan-dim' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium',
      config.textColor,
      config.bgColor,
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
