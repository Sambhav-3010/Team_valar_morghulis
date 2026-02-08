'use client';

import { Search, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function Topbar() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-11 h-16 flex items-center justify-between px-8 bg-surface backdrop-blur-xl border-b border-border-subtle">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div
          className={cn(
            'flex items-center gap-2.5 px-3.5 py-2 rounded-lg',
            'border transition-all duration-300',
            searchFocused
              ? 'border-accent/30 bg-surface-1 shadow-[0_0_0_3px_rgba(232,164,74,0.08)]'
              : 'border-border-subtle bg-surface-1/50 hover:bg-surface-1',
          )}
        >
          <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <input
            type="text"
            placeholder="Search people, projects, metrics..."
            className="bg-transparent text-sm text-text-primary placeholder:text-text-ghost outline-none w-full font-body"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-text-ghost border border-border-subtle bg-surface-2">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* AI Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-dim mr-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-medium text-accent">AI Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-soft" />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-2.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose border-2 border-surface-0" />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2.5 ml-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-blue flex items-center justify-center">
            <span className="text-xs font-semibold text-white">AM</span>
          </div>
        </button>
      </div>
    </header>
  );
}
