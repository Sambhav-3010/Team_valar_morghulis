'use client';

import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { MetricPoint } from '@/data/mock';
import { useChartColors } from '@/hooks/useThemeColors';

interface SparkLineProps {
  data: MetricPoint[];
  color?: string;
  height?: number;
}

export function SparkLine({ data, color, height = 40 }: SparkLineProps) {
  const chartColors = useChartColors();
  const strokeColor = color ?? chartColors.accent;
  const id = `spark-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={1.5}
          fill={`url(#${id})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
