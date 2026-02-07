'use client';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-void relative">
      {/* Ambient background glows */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="noise-overlay" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="ml-[240px] transition-all duration-300">
        <Topbar />
        <main className="p-8 relative z-10 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
