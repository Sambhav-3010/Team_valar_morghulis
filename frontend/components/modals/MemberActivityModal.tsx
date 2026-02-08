'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Slack, Trello, Calendar, Clock, Activity as ActivityIcon } from 'lucide-react';
import { fetchUserActivities } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MemberActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name: string;
        email: string;
        avatar: string;
        role: string;
        team: string;
    } | null;
}

export function MemberActivityModal({ isOpen, onClose, user }: MemberActivityModalProps) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user?.email) {
            loadActivities();
        }
    }, [isOpen, user]);

    const loadActivities = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const data = await fetchUserActivities(user.email);
            setActivities(data.activities || []);
        } catch (err) {
            console.error('Failed to load user activities:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    // Calculate quick metrics
    const totalActivities = activities.length;
    const sources = activities.reduce((acc: any, curr: any) => {
        acc[curr.source] = (acc[curr.source] || 0) + 1;
        return acc;
    }, {});

    const topSource = Object.entries(sources).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'None';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1000 overflow-hidden"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-1000 w-[80vw] h-[80vh] bg-surface-1 rounded-2xl shadow-2xl border border-border-subtle flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface-2/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-violet/10 text-violet flex items-center justify-center text-lg font-bold">
                                    {user.avatar}
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-text-primary">{user.name}</h2>
                                    <p className="text-sm text-text-secondary">{user.role} · {user.team}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-surface-3 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar / Metrics */}
                            <div className="w-64 bg-surface-2/20 border-r border-border-subtle p-6 flex flex-col gap-6 overflow-y-auto">
                                <div>
                                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Key Measures</h3>
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl bg-surface-2 border border-border-subtle">
                                            <div className="flex items-center gap-2 mb-1 text-text-secondary">
                                                <ActivityIcon className="w-4 h-4" />
                                                <span className="text-xs">Recent Activities</span>
                                            </div>
                                            <div className="text-2xl font-bold text-text-primary">{totalActivities}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-surface-2 border border-border-subtle">
                                            <div className="flex items-center gap-2 mb-1 text-text-secondary">
                                                <Github className="w-4 h-4" />
                                                <span className="text-xs">Top Source</span>
                                            </div>
                                            <div className="text-xl font-bold text-text-primary capitalize">{topSource}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Sources</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(sources).map(source => (
                                            <div key={source} className="px-3 py-1.5 rounded-lg bg-surface-3 text-xs text-text-secondary capitalize flex items-center gap-2">
                                                {source === 'github' && <Github className="w-3 h-3" />}
                                                {source === 'slack' && <Slack className="w-3 h-3" />}
                                                {source === 'jira' && <Trello className="w-3 h-3" />}
                                                {source}
                                                <span className="opacity-60">({sources[source]})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Content - Activity Feed */}
                            <div className="flex-1 p-6 overflow-y-auto bg-surface-1">
                                <h3 className="text-lg font-semibold mb-6">Activity Feed</h3>

                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                    </div>
                                ) : activities.length === 0 ? (
                                    <div className="text-center py-20 text-text-tertiary">
                                        No recent activities found for this user.
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-w-3xl">
                                        {activities.map((activity, i) => (
                                            <div key={activity.id || i} className="flex gap-4 p-4 rounded-xl bg-surface-2/30 border border-border-subtle hover:bg-surface-2/50 transition-colors group">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                                    activity.source === 'slack' && "bg-[#4A154B]/10 border-[#4A154B]/20 text-[#4A154B] dark:text-[#E01E5A]",
                                                    activity.source === 'github' && "bg-zinc-800/10 border-zinc-700/20 text-zinc-700 dark:text-zinc-300",
                                                    activity.source === 'jira' && "bg-[#0052CC]/10 border-[#0052CC]/20 text-[#0052CC] dark:text-[#4F92FF]",
                                                    !['slack', 'github', 'jira'].includes(activity.source) && "bg-accent/10 border-accent/20 text-accent"
                                                )}>
                                                    {activity.source === 'slack' && <Slack className="w-5 h-5" />}
                                                    {activity.source === 'github' && <Github className="w-5 h-5" />}
                                                    {activity.source === 'jira' && <Trello className="w-5 h-5" />}
                                                    {!['slack', 'github', 'jira'].includes(activity.source) && <ActivityIcon className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0 py-0.5">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-text-primary capitalize tracking-tight">
                                                                {activity.source} {activity.type?.replace(/_/g, ' ')}
                                                            </span>
                                                            {activity.project && (
                                                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-3 text-text-tertiary border border-border-subtle">
                                                                    {activity.project}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-text-tertiary whitespace-nowrap font-mono">
                                                            {timeAgo(new Date(activity.timestamp))}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed group-hover:text-text-primary transition-colors">
                                                        {getActivityText(activity)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function getActivityText(activity: any): string {
    if (!activity) return 'Unknown activity';

    const metadata = activity.metadata || {};

    // Slack
    if (activity.source === 'slack') {
        if (activity.type === 'reaction_added') return `Reacted with :${metadata.reaction}: in #${metadata.channel}`;
        return metadata.text || 'Sent a message';
    }

    // Jira
    if (activity.source === 'jira') {
        if (activity.type === 'ticket_created') return `Created ticket ${metadata.ticket}: ${metadata.title}`;
        if (activity.type === 'status_change') return `Moved ${metadata.ticket} from ${metadata.fromStatus} to ${metadata.toStatus}`;
        if (activity.type === 'comment') return `Commented on ${metadata.ticket}`;
    }

    // GitHub
    if (activity.source === 'github') {
        if (activity.type === 'commit') return `Committed: ${metadata.message}`;
        if (activity.type === 'pull_request') return `Opened PR #${metadata.prNumber}: ${metadata.title}`;
        if (activity.type === 'review') return `Reviewed PR #${metadata.prNumber}`;
    }

    // Fallback using metadata keys if possible
    if (metadata.title) return metadata.title;
    if (metadata.description) return metadata.description;
    if (metadata.message) return metadata.message;

    return 'Activity recorded';
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}
