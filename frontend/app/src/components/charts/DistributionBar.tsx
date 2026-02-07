'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Segment {
  type: string;
  percentage: number;
  color: string;
}

interface DistributionBarProps {
  segments: Segment[];
  height?: number;
}

export function DistributionBar({ segments, height = 8 }: DistributionBarProps) {
  return (
    <div>
      {/* Bar */}
      <div
        className="flex rounded-full overflow-hidden gap-[2px]"
        style={{ height }}
      >
        {segments.map((segment, i) => (
          <motion.div
            key={segment.type}
            initial={{ width: 0 }}
            animate={{ width: `${segment.percentage}%` }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            style={{ backgroundColor: segment.color }}
            className="rounded-full"
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {segments.map((segment) => (
          <div key={segment.type} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[11px] text-text-secondary">{segment.type}</span>
            <span className="text-[11px] font-mono text-text-ghost">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
