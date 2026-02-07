'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useHealthColor, useChartColors } from '@/hooks/useThemeColors';
import type { Project } from '@/data/mock';

interface ProjectCardProps {
  project: Project;
  delay?: number;
}

export function ProjectCard({ project, delay = 0 }: ProjectCardProps) {
  const healthColor = useHealthColor(project.health);
  const chartColors = useChartColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="card card-interactive p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-display font-medium text-text-primary">{project.name}</h3>
          <p className="text-xs text-text-ghost font-mono mt-0.5">{project.team}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-ghost">Progress</span>
          <span className="text-xs font-mono text-text-secondary">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 1, delay: delay * 0.08 + 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-full rounded-full"
            style={{ backgroundColor: healthColor }}
          />
        </div>
      </div>

      {/* Health indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-ghost">Health</span>
        <div className="flex-1 flex items-center gap-1.5">
          <div className="flex gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-3 rounded-[1px]"
                style={{
                  backgroundColor: i < Math.round(project.health / 10)
                    ? healthColor
                    : chartColors.healthInactive,
                }}
              />
            ))}
          </div>
          <span className="text-xs font-mono" style={{ color: healthColor }}>
            {project.health}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
