'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHealthColor } from '@/hooks/useThemeColors';
import type { Person } from '@/data/mock';

const activityConfig = {
  balanced: { label: 'Balanced', color: 'text-emerald', bg: 'bg-emerald-dim' },
  high: { label: 'High Activity', color: 'text-cyan', bg: 'bg-cyan-dim' },
  low: { label: 'Low Activity', color: 'text-accent', bg: 'bg-accent-dim' },
  overloaded: { label: 'Overloaded', color: 'text-rose', bg: 'bg-rose-dim' },
};

interface PersonCardProps {
  person: Person;
  delay?: number;
}

export function PersonCard({ person, delay = 0 }: PersonCardProps) {
  const activity = activityConfig[person.activityLevel];
  const scoreColor = useHealthColor(person.spaceScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className="card card-interactive p-5"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-surface-3 to-surface-4 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-text-secondary">{person.avatar}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-medium text-text-primary truncate">
              {person.name}
            </h3>
            <span className={cn(
              'text-[10px] font-mono px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0',
              activity.color,
              activity.bg,
            )}>
              {activity.label}
            </span>
          </div>
          <p className="text-xs text-text-ghost mt-0.5">{person.role} · {person.team}</p>

          {/* SPACE Score */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-ghost">SPACE</span>
            <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${person.spaceScore}%` }}
                transition={{ duration: 0.8, delay: delay * 0.06 + 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="h-full rounded-full"
                style={{ backgroundColor: scoreColor }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: scoreColor }}>
              {person.spaceScore}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
