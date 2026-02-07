'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useChartColors } from '@/hooks/useThemeColors';

interface RingGaugeProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function RingGauge({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color,
  label,
  sublabel,
}: RingGaugeProps) {
  const chartColors = useChartColors();
  const strokeColor = color ?? chartColors.accent;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={chartColors.ringBg}
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-display font-semibold text-text-primary">
            {value}
          </span>
          <span className="text-[10px] font-mono text-text-ghost">
            /{max}
          </span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <p className="text-xs font-medium text-text-secondary">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-text-ghost">{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
