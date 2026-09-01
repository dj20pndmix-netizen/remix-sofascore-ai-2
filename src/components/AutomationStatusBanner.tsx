/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { AutomationStatusPayload, AutomationLogEntry } from '../types';
import {
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Radio,
  FileCheck,
  AlertTriangle,
  Cpu
} from 'lucide-react';

interface Props {
  onTriggerSync?: () => void;
}

export function AutomationStatusBanner({ onTriggerSync }: Props) {
  const [status, setStatus] = useState<AutomationStatusPayload | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/automation/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Background poll silently
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualTrigger = async () => {
    setSyncing(true);
    try {
      await fetch('/api/automation/trigger-sync', { method: 'POST' });
      await fetchStatus();
      if (onTriggerSync) onTriggerSync();
    } catch (err) {
      console.error('Trigger sync error:', err);
    } finally {
      setTimeout(() => setSyncing(false), 800);
    }
  };

  const getLogIcon = (level: AutomationLogEntry['level']) => {
    switch (level) {
      case 'settle':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'lineup':
        return <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'recalc':
        return <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'injury':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'sync':
        return <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-emerald-500/30 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Top Banner Bar */}
      <div className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 bg-emerald-950/20 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Cpu className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>Fully Automated Prediction System</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE • ZERO MANUAL INTERVENTION
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <span>Timezone: Africa/Kampala (EAT • UTC+3)</span>
              <span>&bull;</span>
              <span>{status?.kampalaTime || 'Live Clock Synchronizing...'}</span>
            </p>
          </div>
        </div>

        {/* Live Counters & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
            <div className="px-2.5 py-1 rounded bg-black/40 border border-white/10 text-neutral-300">
              <span className="text-emerald-400 font-bold">{status?.autoRecalculationsCount ?? 0}</span> Auto-Recalcs
            </div>
            <div className="px-2.5 py-1 rounded bg-black/40 border border-white/10 text-neutral-300">
              <span className="text-blue-400 font-bold">{status?.autoConfirmedLineupsCount ?? 0}</span> Confirmed XIs
            </div>
            <div className="px-2.5 py-1 rounded bg-black/40 border border-white/10 text-neutral-300">
              <span className="text-purple-400 font-bold">{status?.autoSettledCount ?? 0}</span> Auto-Settled
            </div>
            {status?.recentAlerts && status.recentAlerts.length > 0 && (
              <div className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                <span className="text-emerald-400 font-bold">{status.recentAlerts.length}</span> Alerts Dispatched
              </div>
            )}
          </div>

          <button
            onClick={handleManualTrigger}
            disabled={syncing}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Execute immediate automation cycle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Now</span>
          </button>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Activity ({status?.recentLogs?.length || 0})</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Live Automation Log Activity Drawer */}
      {showLogs && (
        <div className="p-3 sm:p-4 bg-black/50 border-t border-white/10 space-y-2 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold mb-2">
            <span className="uppercase tracking-wider">Automated Background Engine Activity Log</span>
            <span className="font-mono text-[10px]">Autonomic Cycle: Every 20s</span>
          </div>

          {status?.recentLogs && status.recentLogs.length > 0 ? (
            <div className="space-y-1.5 font-mono text-xs">
              {status.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 p-2 rounded bg-white/[0.03] border border-white/5 text-neutral-300"
                >
                  {getLogIcon(log.level)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-neutral-400">
                      <span className="font-semibold text-emerald-400 uppercase">{log.level}</span>
                      <span>{log.kampalaTime}</span>
                    </div>
                    <div className="text-xs text-neutral-200 mt-0.5">{log.message}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-neutral-400">
              Automation engine is monitoring fixtures. Logs will stream automatically.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
