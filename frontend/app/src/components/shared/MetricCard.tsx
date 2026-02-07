'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, getTrendDirection, getTrendPercentage } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  previous?: number;
  current?: number;
  rating?: 'elite' | 'high' | 'medium' | 'low';
  icon?: React.ReactNode;
  accentColor?: string;
  delay?: number;
}

const ratingConfig = {
  elite: { label: 'Elite', color: 'text-emerald', bg: 'bg-emerald-dim' },
  high: { label: 'High', color: 'text-cyan', bg: 'bg-cyan-dim' },
  medium: { label: 'Medium', color: 'text-accent', bg: 'bg-accent-dim' },
  low: { label: 'Low', color: 'text-rose', bg: 'bg-rose-dim' },
};

export function MetricCard({
  label,
  value,
  unit,
  previous,
  current,
  rating,
  icon,
  accentColor,
  delay = 0,
}: MetricCardProps) {
  const trend = current !== undefined && previous !== undefined
    ? getTrendDirection(current, previous)
    : undefined;
  const trendPct = current !== undefined && previous !== undefined
    ? Math.abs(getTrendPercentage(current, previous))
    : undefined;

  const isPositiveTrend = trend === 'up';
  const trendLabel = label.toLowerCase().includes('failure') || label.toLowerCase().includes('time') || label.toLowerCase().includes('load')
    ? !isPositiveTrend
    : isPositiveTrend;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: [0.23, 1, 0.32, 1] }}
      className="card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        {rating && (
          <span className={cn(
            'text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full',
            ratingConfig[rating].color,
            ratingConfig[rating].bg,
          )}>
            {ratingConfig[rating].label}
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        {icon && (
          <div className={cn('p-2 rounded-lg', accentColor || 'bg-surface-2')}>
            {icon}
          </div>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-display font-semibold text-text-primary tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-text-tertiary font-mono">
              {unit}
            </span>
          )}
        </div>
      </div>

      {trend && trendPct !== undefined && (
        <div className="flex items-center gap-1.5 pt-1">
          {trend === 'up' && <TrendingUp className={cn('w-3.5 h-3.5', trendLabel ? 'text-emerald' : 'text-rose')} />}
          {trend === 'down' && <TrendingDown className={cn('w-3.5 h-3.5', trendLabel ? 'text-emerald' : 'text-rose')} />}
          {trend === 'flat' && <Minus className="w-3.5 h-3.5 text-text-tertiary" />}
          <span className={cn(
            'text-xs font-medium',
            trend === 'flat' ? 'text-text-tertiary' : trendLabel ? 'text-emerald' : 'text-rose',
          )}>
            {trendPct.toFixed(1)}%
          </span>
          <span className="text-xs text-text-ghost">vs prev period</span>
        </div>
      )}
    </motion.div>
  );
}
