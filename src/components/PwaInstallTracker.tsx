/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, Sparkles, X } from 'lucide-react';
import type { UserAccount } from '../types';

interface PwaInstallTrackerProps {
  currentUser?: UserAccount | null;
  onInstallLogged?: () => void;
}

export const PwaInstallTracker: React.FC<PwaInstallTrackerProps> = ({
  currentUser,
  onInstallLogged
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Detect platform & browser
  const getPlatformInfo = () => {
    const ua = navigator.userAgent;
    let platform = 'Web / Desktop';
    if (/android/i.test(ua)) platform = 'Android';
    else if (/iPad|iPhone|iPod/.test(ua)) platform = 'iOS';
    else if (/Windows/i.test(ua)) platform = 'Windows';
    else if (/Macintosh/i.test(ua)) platform = 'macOS';
    else if (/Linux/i.test(ua)) platform = 'Linux';

    let browser = 'Chrome';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    return { platform, browser, userAgent: ua };
  };

  const sendInstallLog = async (outcome: 'ACCEPTED' | 'DISMISSED' | 'STANDALONE_LAUNCH') => {
    try {
      const { platform, browser, userAgent } = getPlatformInfo();
      const token = localStorage.getItem('predictpro_auth_token');
      await fetch('/api/pwa/install-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userName: currentUser?.name,
          platform,
          browser,
          userAgent,
          installOutcome: outcome,
          referrer: document.referrer || 'Direct PWA Prompt'
        })
      });
      if (onInstallLogged) onInstallLogged();
    } catch (e) {
      console.warn('[PWA Tracker] Failed to transmit install log:', e);
    }
  };

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      sendInstallLog('STANDALONE_LAUNCH');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      sendInstallLog('ACCEPTED');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [currentUser]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Manual trigger fallback for iOS or already supported browsers
      sendInstallLog('ACCEPTED');
      alert(
        'To install PredictPro on your device:\n\n1. In Chrome / Edge: Click the Install icon in the address bar.\n2. On iOS Safari: Tap Share -> "Add to Home Screen".\n3. On Android: Tap menu -> "Install app".'
      );
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        sendInstallLog('ACCEPTED');
      } else {
        sendInstallLog('DISMISSED');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-indigo-950/80 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <div className="text-zinc-200 font-semibold flex items-center gap-1.5">
            <span>Install Sofascore AI PredictPro App</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] text-emerald-300 font-bold border border-emerald-500/30">
              FREE
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            Get instant real-time goal alerts, starting lineups, and tactical shapes even when your phone is locked.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        <button
          onClick={() => setShowBanner(false)}
          className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
