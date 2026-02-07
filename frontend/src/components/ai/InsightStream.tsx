'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightStreamProps {
  message: string;
  typing?: boolean;
}

export function InsightStream({ message, typing = false }: InsightStreamProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="card p-5 bg-gradient-to-br from-surface-1 to-surface-2 border-accent/10"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent-dim flex-shrink-0">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-display font-medium text-accent">Synth AI</span>
            <span className="text-[10px] font-mono text-text-ghost">just now</span>
          </div>
          <p className={cn(
            'text-sm text-text-secondary leading-relaxed font-serif italic',
            typing && 'cursor-blink',
          )}>
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
