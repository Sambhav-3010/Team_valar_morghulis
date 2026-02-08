'use client';

import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { MetricPoint } from '@/data/mock';
import { useChartColors } from '@/hooks/useThemeColors';

interface TrendChartProps {
  data: MetricPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  gradientId?: string;
}

export function TrendChart({
  data,
  color,
  height = 200,
  showGrid = true,
  showAxis = true,
  gradientId = 'trendGradient',
}: TrendChartProps) {
  const chartColors = useChartColors();
  const strokeColor = color ?? chartColors.accent;
  const uniqueId = `${gradientId}-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              vertical={false}
            />
          )}
          {showAxis && (
            <>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: chartColors.axis }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: chartColors.axis }}
                width={40}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: chartColors.tooltipBg,
              border: `1px solid ${chartColors.tooltipBorder}`,
              borderRadius: '8px',
              boxShadow: chartColors.tooltipShadow,
              padding: '8px 12px',
            }}
            labelStyle={{ color: chartColors.tooltipLabel, fontSize: 11, fontFamily: 'JetBrains Mono' }}
            itemStyle={{ color: chartColors.tooltipValue, fontSize: 12 }}
            labelFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${uniqueId})`}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              stroke: strokeColor,
              fill: chartColors.dotFill,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
