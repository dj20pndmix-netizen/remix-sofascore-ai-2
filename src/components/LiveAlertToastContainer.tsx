/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { LiveAlertEvent } from '../types';
import { globalNotificationService } from '../notificationService';
import {
  Bell,
  X,
  CheckCircle2,
  FileCheck,
  Zap,
  Volume2,
  Radio,
  Flame,
  Trophy,
  XCircle,
  RotateCcw,
  Calendar,
  Mail,
  KeyRound
} from 'lucide-react';

export function LiveAlertToastContainer() {
  const [activeToasts, setActiveToasts] = useState<LiveAlertEvent[]>([]);

  useEffect(() => {
    const unsubscribe = globalNotificationService.subscribeToAlerts((newAlert) => {
      setActiveToasts((prev) => [newAlert, ...prev.slice(0, 3)]);

      // Auto dismiss after 7 seconds
      setTimeout(() => {
        setActiveToasts((current) => current.filter((t) => t.id !== newAlert.id));
      }, 7000);
    });

    return () => unsubscribe();
  }, []);

  const dismissToast = (id: string) => {
    setActiveToasts((current) => current.filter((t) => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {activeToasts.map((toast) => {
        const isWon = toast.eventType === 'PREDICTION_WON';
        const isLost = toast.eventType === 'PREDICTION_LOST';
        const isVoid = toast.eventType === 'PREDICTION_VOID';
        const isGoal = toast.eventType === 'GOAL';
        const isLineup = toast.eventType === 'LINEUP_CONFIRMED';
        const isRecalc = toast.eventType === 'PREDICTION_RECALCULATED';
        const isMatchday = toast.eventType === 'MATCHDAY_STARTED';
        const isEmail = toast.eventType === 'EMAIL_VERIFICATION';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all transform animate-in slide-in-from-top-4 duration-300 ${
              isWon
                ? 'bg-gradient-to-r from-emerald-950/95 via-neutral-900/95 to-emerald-950/95 border-emerald-500/70 text-white shadow-emerald-900/50 ring-2 ring-emerald-500/30'
                : isLost
                ? 'bg-gradient-to-r from-rose-950/95 via-neutral-900/95 to-rose-950/95 border-rose-500/70 text-white shadow-rose-900/50'
                : isVoid
                ? 'bg-gradient-to-r from-amber-950/95 via-neutral-900/95 to-amber-950/95 border-amber-500/70 text-white shadow-amber-900/50'
                : isMatchday
                ? 'bg-gradient-to-r from-emerald-950/95 via-neutral-900/95 to-teal-950/95 border-emerald-400/80 text-white shadow-emerald-900/50 ring-2 ring-emerald-400/30'
                : isEmail
                ? 'bg-gradient-to-r from-blue-950/95 via-neutral-900/95 to-cyan-950/95 border-blue-400/80 text-white shadow-blue-900/50 ring-2 ring-blue-400/30'
                : isGoal
                ? 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-900/40'
                : isLineup
                ? 'bg-blue-950/95 border-blue-500/60 text-white shadow-blue-900/40'
                : isRecalc
                ? 'bg-amber-950/95 border-amber-500/60 text-white shadow-amber-900/40'
                : 'bg-neutral-900/95 border-neutral-700 text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                    isWon
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                      : isLost
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-400/50'
                      : isVoid
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50'
                      : isMatchday
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                      : isEmail
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                      : isGoal
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isLineup
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : isRecalc
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {isWon ? (
                    <Trophy className="w-5 h-5 animate-bounce text-emerald-400" />
                  ) : isLost ? (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  ) : isVoid ? (
                    <RotateCcw className="w-5 h-5 text-amber-400" />
                  ) : isMatchday ? (
                    <Calendar className="w-5 h-5 animate-pulse text-emerald-300" />
                  ) : isEmail ? (
                    <Mail className="w-5 h-5 animate-pulse text-blue-300" />
                  ) : isGoal ? (
                    <Flame className="w-5 h-5 animate-bounce" />
                  ) : isLineup ? (
                    <FileCheck className="w-5 h-5" />
                  ) : isRecalc ? (
                    <Zap className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isWon
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                          : isLost
                          ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50'
                          : isVoid
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                          : isGoal
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : isLineup
                          ? 'bg-blue-500/30 text-blue-200'
                          : isRecalc
                          ? 'bg-amber-500/30 text-amber-200'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {toast.eventType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">{toast.kampalaTime}</span>
                  </div>

                  <h4 className="font-black text-xs sm:text-sm text-white mt-1 leading-snug">
                    {toast.title}
                  </h4>
                  <p className="text-xs text-neutral-200 mt-0.5 leading-normal">
                    {toast.body}
                  </p>

                  {toast.score && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/50 border border-white/10 font-mono text-xs font-bold text-emerald-400">
                      <span>Score:</span>
                      <span className="text-white">{toast.score}</span>
                      {toast.minute && <span className="text-neutral-400 font-normal">({toast.minute})</span>}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
