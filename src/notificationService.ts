/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LiveAlertEvent, NotificationPreferences, AlertEventType } from './types';

const STORAGE_KEY_PREFS = 'kickoff_notification_preferences';
const STORAGE_KEY_SEEN_ALERTS = 'kickoff_seen_alerts_ids';

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  notifyGoals: true,
  notifyLineups: true,
  notifyRecalculations: true,
  notifyFullTime: true,
  notifyOutcomes: true,
  backgroundPushEnabled: true
};

type AlertListener = (alert: LiveAlertEvent) => void;
type AlertListListener = (alerts: LiveAlertEvent[]) => void;

class NotificationService {
  private prefs: NotificationPreferences = DEFAULT_PREFS;
  private seenAlertIds: Set<string> = new Set();
  private alerts: LiveAlertEvent[] = [];
  private alertListeners: Set<AlertListener> = new Set();
  private listListeners: Set<AlertListListener> = new Set();
  private pollTimer: any = null;
  private audioCtx: AudioContext | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.loadPreferences();
    this.loadSeenAlerts();
  }

  public async init() {
    this.registerServiceWorker();
    this.startPolling();
  }

  /**
   * Registers Service Worker for background notifications and offline sync
   */
  private async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      this.swRegistration = registration;
      console.log('[NotificationService] Service Worker registered for Background Push:', registration.scope);
    } catch (err) {
      console.warn('[NotificationService] Service Worker registration note:', err);
    }
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.prefs };
  }

  public savePreferences(newPrefs: Partial<NotificationPreferences>) {
    this.prefs = { ...this.prefs, ...newPrefs };
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(this.prefs));
    } catch {
      // Ignore storage errors
    }
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) {
        this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch {
      this.prefs = DEFAULT_PREFS;
    }
  }

  private loadSeenAlerts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEEN_ALERTS);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        ids.forEach(id => this.seenAlertIds.add(id));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private persistSeenAlerts() {
    try {
      const ids = Array.from(this.seenAlertIds).slice(-100);
      localStorage.setItem(STORAGE_KEY_SEEN_ALERTS, JSON.stringify(ids));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Check if browser notifications are supported
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current browser notification permission
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request browser permission for system desktop / mobile background notifications
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.savePreferences({ enabled: true, backgroundPushEnabled: true });
        this.playAudioChime('PREDICTION_WON');
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Play clean synthesized audio chime using Web Audio API (Zero asset dependencies)
   */
  public playAudioChime(type: AlertEventType) {
    if (!this.prefs.soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (type === 'PREDICTION_WON') {
        // Victory Fanfare Chime: Major Arpeggio with celebratory flourish (C5 -> E5 -> G5 -> C6 -> E6)
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);

          gain.gain.setValueAtTime(0.001, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.35, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.45);
        });
      } else if (type === 'PREDICTION_LOST') {
        // Soft low notification tone
        const notes = [440.0, 349.23];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);

          gain.gain.setValueAtTime(0.001, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.15 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.4);
        });
      } else if (type === 'GOAL') {
        // Goal Fanfare Chime: Triad arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);

          gain.gain.setValueAtTime(0.001, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.1 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.4);
        });
      } else if (type === 'LINEUP_CONFIRMED') {
        // Lineup Ping: Two crisp high-tones (A5 -> D6)
        const notes = [880.0, 1174.66];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);

          gain.gain.setValueAtTime(0.001, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.3);
        });
      } else if (type === 'MATCHDAY_STARTED') {
        // Bright Day Kickoff Fanfare: (C5 -> G5 -> C6)
        const notes = [523.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);

          gain.gain.setValueAtTime(0.001, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.4);
        });
      } else if (type === 'EMAIL_VERIFICATION') {
        // Security Ping: (E5 -> B5)
        const notes = [659.25, 987.77];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);

          gain.gain.setValueAtTime(0.001, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.3);
        });
      } else {
        // Subtle soft notification bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch (err) {
      // Audio autoplay policy or device mute
    }
  }

  /**
   * Dispatch system background desktop / mobile notification via Service Worker / Web Notification API
   */
  public dispatchBrowserNotification(alert: LiveAlertEvent) {
    if (!this.isSupported() || Notification.permission !== 'granted' || !this.prefs.enabled) {
      return;
    }

    // Filter by user preference
    if (alert.eventType === 'GOAL' && !this.prefs.notifyGoals) return;
    if (alert.eventType === 'LINEUP_CONFIRMED' && !this.prefs.notifyLineups) return;
    if (alert.eventType === 'PREDICTION_RECALCULATED' && !this.prefs.notifyRecalculations) return;
    if (alert.eventType === 'FULLTIME' && !this.prefs.notifyFullTime) return;
    if (
      (alert.eventType === 'PREDICTION_WON' || alert.eventType === 'PREDICTION_LOST' || alert.eventType === 'PREDICTION_VOID') &&
      !this.prefs.notifyOutcomes
    ) {
      return;
    }

    const options: any = {
      body: alert.body,
      icon:
        alert.eventType === 'PREDICTION_WON'
          ? 'https://ui-avatars.com/api/?name=WIN&background=10b981&color=ffffff&bold=true&rounded=true'
          : alert.eventType === 'PREDICTION_LOST'
          ? 'https://ui-avatars.com/api/?name=LOSE&background=ef4444&color=ffffff&bold=true&rounded=true'
          : alert.eventType === 'MATCHDAY_STARTED'
          ? 'https://ui-avatars.com/api/?name=DAY&background=10b981&color=ffffff&bold=true&rounded=true'
          : alert.eventType === 'EMAIL_VERIFICATION'
          ? 'https://ui-avatars.com/api/?name=OTP&background=0284c7&color=ffffff&bold=true&rounded=true'
          : 'https://ui-avatars.com/api/?name=FT&background=10b981&color=ffffff&bold=true&rounded=true',
      badge: 'https://ui-avatars.com/api/?name=FT&background=059669&color=ffffff&bold=true',
      tag: alert.id,
      silent: !this.prefs.soundEnabled,
      vibrate: [200, 100, 200],
      requireInteraction: alert.eventType === 'PREDICTION_WON' || alert.eventType === 'GOAL'
    };

    // If Service Worker is active, dispatch background notification through SW registration
    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      this.swRegistration.showNotification(alert.title, options).catch(() => {
        this.fallbackNotification(alert.title, options);
      });
    } else {
      this.fallbackNotification(alert.title, options);
    }
  }

  private fallbackNotification(title: string, options: NotificationOptions) {
    try {
      const n = new Notification(title, options);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (err) {
      // Fallback for environment constraints
    }
  }

  /**
   * Handles incoming alert event from centralized background sync
   */
  public processIncomingAlert(alert: LiveAlertEvent, isNewEvent: boolean = true) {
    if (!this.seenAlertIds.has(alert.id)) {
      this.seenAlertIds.add(alert.id);
      this.persistSeenAlerts();

      this.alerts.unshift(alert);
      if (this.alerts.length > 60) {
        this.alerts.pop();
      }

      if (isNewEvent) {
        // 1. Play audio chime
        this.playAudioChime(alert.eventType);

        // 2. Dispatch system browser push notification (via Service Worker)
        this.dispatchBrowserNotification(alert);

        // 3. Notify in-app toast / banner listeners
        this.alertListeners.forEach(listener => {
          try {
            listener(alert);
          } catch (e) {
            console.error('Error in alert listener:', e);
          }
        });
      }

      // Notify list subscribers
      this.listListeners.forEach(listener => {
        try {
          listener([...this.alerts]);
        } catch (e) {
          console.error('Error in list listener:', e);
        }
      });
    }
  }

  /**
   * Subscribe to new real-time alert popups
   */
  public subscribeToAlerts(listener: AlertListener): () => void {
    this.alertListeners.add(listener);
    return () => {
      this.alertListeners.delete(listener);
    };
  }

  /**
   * Subscribe to full alert list changes
   */
  public subscribeToList(listener: AlertListListener): () => void {
    this.listListeners.add(listener);
    listener([...this.alerts]);
    return () => {
      this.listListeners.delete(listener);
    };
  }

  public getAlerts(): LiveAlertEvent[] {
    return [...this.alerts];
  }

  public markAllAsRead() {
    this.alerts = this.alerts.map(a => ({ ...a, isRead: true }));
    this.listListeners.forEach(listener => listener([...this.alerts]));
  }

  public clearAllAlerts() {
    this.alerts = [];
    this.listListeners.forEach(listener => listener([]));
  }

  /**
   * Trigger Test Alert from client
   */
  public async triggerTestAlert(eventType: AlertEventType = 'GOAL'): Promise<LiveAlertEvent | null> {
    try {
      const res = await fetch('/api/automation/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alert) {
          this.processIncomingAlert(data.alert, true);
          return data.alert;
        }
      }
    } catch (err) {
      console.error('Error triggering test alert:', err);
    }
    return null;
  }

  /**
   * Trigger Goal Simulation from client
   */
  public async simulateGoalEvent(matchId?: number): Promise<void> {
    try {
      const res = await fetch('/api/automation/simulate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alert) {
          this.processIncomingAlert(data.alert, true);
        }
      }
    } catch (err) {
      console.error('Error simulating goal event:', err);
    }
  }

  /**
   * Background polling worker for alerts synchronized with the automation engine
   */
  private startPolling() {
    if (this.pollTimer) return;

    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/automation/alerts');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.alerts)) {
            data.alerts.reverse().forEach((alert: LiveAlertEvent) => {
              const isFirstRun = this.alerts.length === 0 && this.seenAlertIds.size === 0;
              this.processIncomingAlert(alert, !isFirstRun);
            });
          }
        }
      } catch {
        // Polling silently
      }
    };

    fetchAlerts();
    this.pollTimer = setInterval(fetchAlerts, 5000);
  }
}

export const globalNotificationService = new NotificationService();
