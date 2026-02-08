'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Code2,
  PackageSearch,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { IntegrationStatus } from './IntegrationStatus';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, section: 'main' },
  { href: '/hr', label: 'People & Culture', icon: Users, section: 'personas' },
  { href: '/engineering', label: 'Engineering', icon: Code2, section: 'personas' },
  { href: '/product', label: 'Product', icon: PackageSearch, section: 'personas' },
  { href: '/insights', label: 'AI Insights', icon: Sparkles, section: 'ai' },
  { href: '/settings', label: 'Settings', icon: Settings, section: 'system' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sections = [
    { key: 'main', label: null },
    { key: 'personas', label: 'Lenses' },
    { key: 'ai', label: 'Intelligence' },
    { key: 'system', label: 'System' },
  ];

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col',
        'bg-surface-0 border-r border-border-subtle',
        'transition-all duration-300 ease-out',
      )}
      animate={{ width: collapsed ? 72 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-void" strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="font-display font-semibold text-sm text-text-primary tracking-tight">
                PulseIQ
              </span>
              <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-widest">
                Insights
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section.key);
          if (items.length === 0) return null;

          return (
            <div key={section.key} className="mb-4">
              <AnimatePresence>
                {!collapsed && section.label && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.15em] text-text-ghost"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>

              {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'transition-all duration-200 group',
                      isActive
                        ? 'bg-accent-dim text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-accent-dim rounded-lg"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] relative z-10 flex-shrink-0',
                        isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary',
                      )}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className="text-sm font-medium relative z-10 whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Integration Status */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <IntegrationStatus />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-border-subtle">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
            'text-text-tertiary hover:text-text-secondary hover:bg-surface-2',
            'transition-all duration-200',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
