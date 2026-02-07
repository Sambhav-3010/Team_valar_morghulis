'use client';

import { useTheme } from '@/components/providers/ThemeProvider';

const darkChartColors = {
  accent: '#e8a44a',
  cyan: '#4ac4e8',
  emerald: '#4ae8a4',
  rose: '#e84a6a',
  violet: '#a44ae8',
  blue: '#4a7ae8',
  grid: 'rgba(255,255,255,0.04)',
  axis: '#5d6178',
  tooltipBg: '#232636',
  tooltipBorder: 'rgba(255,255,255,0.1)',
  tooltipShadow: '0 8px 32px rgba(0,0,0,0.4)',
  tooltipLabel: '#9295a5',
  tooltipValue: '#e8e9ed',
  dotFill: '#0f1117',
  ringBg: 'rgba(255,255,255,0.06)',
  healthInactive: 'rgba(255,255,255,0.06)',
};

const lightChartColors = {
  accent: '#c4862a',
  cyan: '#1a8fad',
  emerald: '#1a9e6e',
  rose: '#c9354f',
  violet: '#7c2ec9',
  blue: '#2e5ec9',
  grid: 'rgba(0,0,0,0.06)',
  axis: '#7a7e95',
  tooltipBg: '#ffffff',
  tooltipBorder: 'rgba(0,0,0,0.1)',
  tooltipShadow: '0 8px 32px rgba(0,0,0,0.1)',
  tooltipLabel: '#52556a',
  tooltipValue: '#1a1a1f',
  dotFill: '#ffffff',
  ringBg: 'rgba(0,0,0,0.06)',
  healthInactive: 'rgba(0,0,0,0.06)',
};

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkChartColors : lightChartColors;
}

export function useHealthColor(value: number) {
  const colors = useChartColors();
  if (value >= 80) return colors.emerald;
  if (value >= 60) return colors.accent;
  return colors.rose;
}
