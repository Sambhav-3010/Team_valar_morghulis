'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: {
    label: string;
    color: string;
  };
}

export function PageHeader({ title, description, badge }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="mb-10"
    >
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-display font-semibold text-text-primary tracking-tight">
          {title}
        </h1>
        {badge && (
          <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-sm text-text-secondary max-w-2xl leading-relaxed font-body">
        {description}
      </p>
    </motion.div>
  );
}
