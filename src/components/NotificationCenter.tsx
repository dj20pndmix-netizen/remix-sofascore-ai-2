/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type { LiveAlertEvent, NotificationPreferences, AlertEventType } from '../types';
import { globalNotificationService } from '../notificationService';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Sparkles,
  Zap,
  FileCheck,
  Flame,
  Radio,
  ExternalLink,
  ShieldCheck,
  Play,
  Trophy,
  XCircle,
  RotateCcw,
  Smartphone,
  Calendar,
  Mail
} from 'lucide-react';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<LiveAlertEvent[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences>(globalNotificationService.getPreferences());
  const [permission, setPermission] = useState<NotificationPermission>(globalNotificationService.getPermission());
  const [showSettings, setShowSettings] = useState(false);
  const [testingType, setTestingType] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    globalNotificationService.init();

    const unsubscribe = globalNotificationService.subscribeToList((newAlerts) => {
      setAlerts(newAlerts);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const handleRequestPermission = async () => {
    const result = await globalNotificationService.requestPermission();
    setPermission(result);
    setPrefs(globalNotificationService.getPreferences());
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    globalNotificationService.savePreferences(updated);
  };

  const handleTriggerTest = async (type: AlertEventType) => {
    setTestingType(type);
    await globalNotificationService.triggerTestAlert(type);
    setTimeout(() => setTestingType(null), 700);
  };

  const handleSimulateGoal = async () => {
    setTestingType('GOAL_SIM');
    await globalNotificationService.simulateGoalEvent();
    setTimeout(() => setTestingType(null), 700);
  };

  const getAlertIcon = (type: AlertEventType) => {
    switch (type) {
      case 'PREDICTION_WON':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'PREDICTION_LOST':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'PREDICTION_VOID':
        return <RotateCcw className="w-4 h-4 text-amber-400" />;
      case 'GOAL':
        return <Flame className="w-4 h-4 text-emerald-400" />;
      case 'LINEUP_CONFIRMED':
        return <FileCheck className="w-4 h-4 text-blue-400" />;
      case 'PREDICTION_RECALCULATED':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'FULLTIME':
        return <CheckCheck className="w-4 h-4 text-purple-400" />;
      case 'MATCHDAY_STARTED':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'EMAIL_VERIFICATION':
        return <Mail className="w-4 h-4 text-blue-400" />;
      default:
        return <Radio className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Top Header Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            globalNotificationService.markAllAsRead();
          }
        }}
        className="relative p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700/80 text-neutral-200 hover:text-white transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500"
        title="Live Match Alerts, Lineup & Outcome Push Notifications"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
        ) : (
          <Bell className="w-4 h-4 text-neutral-300" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-tight border-2 border-neutral-900 shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Tray */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-neutral-900 border border-neutral-750 shadow-2xl overflow-hidden z-50 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Row */}
          <div className="p-3 bg-neutral-850 border-b border-neutral-750 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Push &amp; Outcome Alerts</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                EAT UTC+3
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  showSettings ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title="Alert preferences"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {alerts.length > 0 && (
                <button
                  onClick={() => globalNotificationService.clearAllAlerts()}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                  title="Clear all alerts"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Browser Permission Banner */}
          {permission !== 'granted' ? (
            <div className="p-2.5 bg-gradient-to-r from-emerald-950/60 to-neutral-900 border-b border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-neutral-300 text-[11px] leading-tight">
                  Activate background push alerts to receive goal chimes, lineups, and Won/Lost outcomes even when the app is closed.
                </span>
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 transition-colors shadow-sm whitespace-nowrap"
              >
                Enable Push
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-emerald-950/30 border-b border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Background Push Active (Service Worker Ready)</span>
              </span>
              <span className="font-mono text-[10px] text-neutral-400">Pops Up Anytime</span>
            </div>
          )}

          {/* Settings Drawer */}
          {showSettings && (
            <div className="p-3 bg-neutral-950/70 border-b border-neutral-750 text-xs space-y-2">
              <div className="font-semibold text-neutral-300 text-[11px] uppercase tracking-wider mb-1">
                Notification Filters &amp; Sound
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTogglePref('notifyOutcomes')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-colors ${
                    prefs.notifyOutcomes
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span>🏆 Won / Lost Outcome</span>
                  {prefs.notifyOutcomes && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleTogglePref('notifyGoals')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-colors ${
                    prefs.notifyGoals
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span>⚽ Live Goals</span>
                  {prefs.notifyGoals && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleTogglePref('notifyLineups')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-colors ${
                    prefs.notifyLineups
                      ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span>📋 Confirmed XIs</span>
                  {prefs.notifyLineups && <Check className="w-3 h-3 text-blue-400" />}
                </button>

                <button
                  onClick={() => handleTogglePref('notifyRecalculations')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-colors ${
                    prefs.notifyRecalculations
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span>⚡ Prob Updates</span>
                  {prefs.notifyRecalculations && <Check className="w-3 h-3 text-amber-400" />}
                </button>

                <button
                  onClick={() => handleTogglePref('soundEnabled')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-colors col-span-2 ${
                    prefs.soundEnabled
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {prefs.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>Audio Chime &amp; Victory Fanfares</span>
                  </span>
                  {prefs.soundEnabled && <Check className="w-3 h-3 text-purple-400" />}
                </button>
              </div>
            </div>
          )}

          {/* Quick Push Verification Triggers */}
          <div className="p-2.5 bg-neutral-900/90 border-b border-neutral-750 space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
              Verify Instant Push &amp; Background Popups:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => handleTriggerTest('PREDICTION_WON')}
                disabled={testingType !== null}
                className="py-1 px-2 rounded bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                title="Test Prediction WON notification"
              >
                <span>🏆 Test WON</span>
              </button>

              <button
                onClick={() => handleTriggerTest('PREDICTION_LOST')}
                disabled={testingType !== null}
                className="py-1 px-2 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                title="Test Prediction LOST notification"
              >
                <span>❌ Test LOST</span>
              </button>

              <button
                onClick={() => handleTriggerTest('GOAL')}
                disabled={testingType !== null}
                className="py-1 px-2 rounded bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>⚽ Test Goal</span>
              </button>

              <button
                onClick={handleSimulateGoal}
                disabled={testingType !== null}
                className="py-1 px-2 rounded bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/40 text-blue-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                title="Simulate live goal"
              >
                <Play className="w-2.5 h-2.5 text-blue-400" />
                <span>Sim Goal</span>
              </button>
            </div>
          </div>

          {/* Alert Feed List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 hover:bg-neutral-800/50 transition-colors ${
                    !alert.isRead ? 'bg-emerald-950/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getAlertIcon(alert.eventType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-400">
                        <span className="font-bold text-neutral-300 truncate">{alert.matchName}</span>
                        <span className="font-mono shrink-0">{alert.kampalaTime}</span>
                      </div>

                      <div className="font-semibold text-xs text-white mt-0.5 leading-snug">
                        {alert.title}
                      </div>

                      <p className="text-[11px] text-neutral-300 mt-0.5 leading-normal line-clamp-2">
                        {alert.body}
                      </p>

                      {alert.score && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[10px] font-bold text-emerald-400">
                          <span>{alert.score}</span>
                          {alert.minute && <span className="text-neutral-400">({alert.minute})</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">
                <Bell className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                <p className="font-medium text-neutral-300">No live alerts yet</p>
                <p className="text-[11px] mt-1 text-neutral-500">
                  Prediction outcomes (Won/Lost), live goals, and confirmed lineups will pop up automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
