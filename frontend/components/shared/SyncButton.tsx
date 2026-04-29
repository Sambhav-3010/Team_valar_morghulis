'use client';

import React, { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { runSync } from '@/lib/api';

interface SyncButtonProps {
    orgId: string;
    onSyncComplete?: () => void;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ orgId, onSyncComplete }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSync = async () => {
        if (status === 'loading') return;
        
        setStatus('loading');
        try {
            await runSync(orgId);
            setStatus('success');
            if (onSyncComplete) onSyncComplete();
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('Sync failed:', err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={status === 'loading'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                status === 'loading' ? 'bg-blue-500/20 text-blue-400 cursor-wait' :
                status === 'success' ? 'bg-green-500/20 text-green-400' :
                status === 'error' ? 'bg-red-500/20 text-red-400' :
                'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
        >
            {status === 'loading' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
            ) : status === 'success' ? (
                <Check className="w-4 h-4" />
            ) : status === 'error' ? (
                <AlertCircle className="w-4 h-4" />
            ) : (
                <RefreshCw className="w-4 h-4" />
            )}
            {status === 'loading' ? 'Syncing...' : 
             status === 'success' ? 'Synced' : 
             status === 'error' ? 'Failed' : 'Sync Now'}
        </button>
    );
};
