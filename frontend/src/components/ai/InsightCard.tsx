'use client';

import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIInsight } from '@/data/mock';

const categoryConfig = {
  observation: {
    icon: Lightbulb,
    color: 'text-cyan',
    bg: 'bg-cyan-dim',
    border: 'border-l-cyan/30',
    label: 'Observation',
  },
  anomaly: {
    icon: AlertTriangle,
    color: 'text-rose',
    bg: 'bg-rose-dim',
    border: 'border-l-rose/30',
    label: 'Anomaly',
  },
  trend: {
    icon: TrendingUp,
    color: 'text-accent',
    bg: 'bg-accent-dim',
    border: 'border-l-accent/30',
    label: 'Trend',
  },
  suggestion: {
    icon: Sparkles,
    color: 'text-violet',
    bg: 'bg-violet-dim',
    border: 'border-l-violet/30',
    label: 'Suggestion',
  },
};

interface InsightCardProps {
  insight: AIInsight;
  delay?: number;
  compact?: boolean;
}

export function InsightCard({ insight, delay = 0, compact = false }: InsightCardProps) {
  const config = categoryConfig[insight.category];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.08, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'card border-l-[3px] p-5 group cursor-pointer',
        config.border,
        'hover:bg-surface-2/50 transition-colors duration-300',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('p-1.5 rounded-md', config.bg)}>
            <Icon className={cn('w-3.5 h-3.5', config.color)} />
          </div>
          <div>
            <span className={cn('text-[10px] font-mono uppercase tracking-wider', config.color)}>
              {config.label}
            </span>
            {insight.relatedMetric && (
              <span className="text-[10px] font-mono text-text-ghost ml-2">
                → {insight.relatedMetric}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3.5 h-3.5 text-text-ghost" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-display font-medium text-text-primary mb-2 leading-snug">
        {insight.title}
      </h3>

      {/* Body */}
      {!compact && (
        <p className="text-sm text-text-secondary leading-relaxed font-serif italic">
          {insight.body}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          {/* Confidence */}
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', config.bg.replace('dim', ''))}
                style={{ width: `${insight.confidence * 100}%`, background: `var(--color-${config.color.replace('text-', '')})` }}
              />
            </div>
            <span className="text-[10px] font-mono text-text-ghost">
              {Math.round(insight.confidence * 100)}%
            </span>
          </div>

          {/* Sources */}
          <div className="flex items-center gap-1">
            {insight.source.map((s) => (
              <span
                key={s}
                className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-3 text-text-ghost"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <span className="text-[10px] font-mono text-text-ghost">{insight.timestamp}</span>
      </div>
    </motion.div>
  );
}
