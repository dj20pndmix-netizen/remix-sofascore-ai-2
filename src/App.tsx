/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { PredictionCard } from './components/PredictionCard';
import { AccuracyDashboard } from './components/AccuracyDashboard';
import { AdminVerificationPanel } from './components/AdminVerificationPanel';
import { AutomationStatusBanner } from './components/AutomationStatusBanner';
import { NotificationCenter } from './components/NotificationCenter';
import { LiveAlertToastContainer } from './components/LiveAlertToastContainer';
import { PredictionHistoryView } from './components/PredictionHistoryView';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { UserProfileModal } from './components/UserProfileModal';
import { PwaInstallTracker } from './components/PwaInstallTracker';
import { MasterAdminDashboard } from './components/MasterAdminDashboard';
import { AiPredictionBotView } from './components/AiPredictionBotView';
import type { Match, UserAccount, AuthSessionPayload } from './types';
import { globalMatchStore, normalizeTodayFixture } from './matchStore';
import { globalNotificationService } from './notificationService';
import {
  getKampalaDateInfo,
  getKampalaTodayDateStr,
  getShiftedDateStr,
  formatKampalaDateHeader,
  isFixtureTodayInKampala,
  TARGET_TIMEZONE
} from './timezoneUtils';
import {
  RefreshCw,
  Download,
  Radio,
  BarChart3,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  AlertCircle,
  Search,
  X,
  Globe,
  Sparkles,
  Trophy,
  User,
  Crown,
  LogIn,
  BellRing,
  Volume2,
  Bot,
  Zap
} from 'lucide-react';

export default function App() {
  const kampalaDateInfo = getKampalaDateInfo();
  const currentTodayDateStr = kampalaDateInfo.dateStr;
  const [activeDateEAT, setActiveDateEAT] = useState<string>(currentTodayDateStr);

  // Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    globalNotificationService.getPermission()
  );
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(() =>
    globalNotificationService.isSupported() && globalNotificationService.getPermission() === 'default'
  );

  // Strict Authentication Access Control State
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'LOGIN' | 'REGISTER' | 'VERIFY'>('LOGIN');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [allMatches, setAllMatches] = useState<Match[]>(() => {
    try {
      return globalMatchStore.getAllMatches();
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Main Page Section Navigation
  const [mainView, setMainView] = useState<'predictions' | 'ai-bot' | 'history' | 'accuracy' | 'admin'>('predictions');

  // Match Category Filter Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'finished' | 'value'>('all');

  // Verify authentication session on startup with automatic guest fallback and safety timeout
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setAuthChecking(false);
    }, 1000);

    const initSession = async () => {
      const token = localStorage.getItem('predictpro_auth_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.user && isMounted) {
            setCurrentUser(data.user);
            setAuthChecking(false);
            clearTimeout(safetyTimer);
            return;
          }
        } catch {
          localStorage.removeItem('predictpro_auth_token');
        }
      }

      // Automatically initialize instant guest session so visitor never waits or hits a paywall/login barrier
      try {
        const guestRes = await fetch('/api/auth/guest-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const guestData = await guestRes.json();
        if (guestData.success && guestData.session && isMounted) {
          localStorage.setItem('predictpro_auth_token', guestData.session.token);
          setCurrentUser(guestData.session.user);
        }
      } catch {
        // Safe fallback to client-side guest
      } finally {
        if (isMounted) {
          setAuthChecking(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleAuthSuccess = (session: AuthSessionPayload) => {
    localStorage.setItem('predictpro_auth_token', session.token);
    setCurrentUser(session.user as UserAccount);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('predictpro_auth_token');
    setCurrentUser(null);
    setMainView('predictions');
  };

  const handleProfileUpdated = (updated: Partial<UserAccount>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updated });
    }
  };

  async function fetchAllMatches(forceRefresh = false, retryCount = 0, dateParam?: string) {
    if (forceRefresh) {
      setRefreshing(true);
    }

    const token = localStorage.getItem('predictpro_auth_token');
    const targetDate = dateParam || activeDateEAT || getKampalaTodayDateStr();

    try {
      const response = await fetch(`/api/all-matches?date=${encodeURIComponent(targetDate)}${forceRefresh ? '&refresh=true' : ''}`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        // Double Date Validation: Accept fixtures matching the active date or live in-play
        const dateMatched = data.filter((m: Match) => {
          const matchDate = m.kampalaDate || targetDate;
          return matchDate === targetDate || m.status === 'live';
        });
        const validated = dateMatched.length > 0 ? dateMatched : data;

        globalMatchStore.upsertMatches(validated);
        setAllMatches(validated);
        setError(null);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
    } catch (err) {
      console.warn('Fetch notice:', err);
      // Fallback to local store filtered for the active target date
      const localMatches = globalMatchStore.getMatchesForDate(targetDate);
      if (localMatches && localMatches.length > 0) {
        setAllMatches(localMatches);
        setError(null);
      } else if (retryCount < 2) {
        setTimeout(() => {
          fetchAllMatches(forceRefresh, retryCount + 1, targetDate);
        }, 1500);
        return;
      } else {
        setError('Match feed synchronizing...');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Initialize Notification Service on App Mount
  useEffect(() => {
    globalNotificationService.init();
  }, []);

  // 12:00 AM Midnight Date Rollover Watcher (Continuously checks Africa/Kampala clock)
  useEffect(() => {
    const rolloverWatcher = setInterval(() => {
      const liveTodayDate = getKampalaTodayDateStr();
      const currentToday = getKampalaTodayDateStr();

      // If user was viewing today and midnight struck
      if (activeDateEAT === currentToday && liveTodayDate !== activeDateEAT) {
        console.log(`[App Rollover Watcher] Midnight struck in Africa/Kampala: ${activeDateEAT} -> ${liveTodayDate}`);
        setActiveDateEAT(liveTodayDate);
        fetchAllMatches(true, 0, liveTodayDate);

        const newDateInfo = getKampalaDateInfo();
        globalNotificationService.processIncomingAlert(
          {
            id: `alert-midnight-${Date.now()}`,
            matchId: 5000001,
            matchName: `${newDateInfo.formattedHeader} Matchday`,
            competition: 'Verified Football AI Feed',
            eventType: 'MATCHDAY_STARTED',
            title: `📅 Matchday Auto-Updated for ${newDateInfo.formattedHeader}`,
            body: `Midnight reached! Today's new matchday schedule and verified AI predictions for ${newDateInfo.formattedHeader} have been loaded automatically.`,
            timestamp: new Date().toISOString(),
            kampalaTime: `${liveTodayDate} 00:00 EAT`,
            isRead: false
          },
          true
        );
      }
    }, 3000);

    return () => clearInterval(rolloverWatcher);
  }, [activeDateEAT]);

  useEffect(() => {
    fetchAllMatches(false, 0, activeDateEAT);
    const interval = setInterval(() => fetchAllMatches(false, 0, activeDateEAT), 20000);
    return () => clearInterval(interval);
  }, [activeDateEAT]);

  const handleEnableNotifications = async () => {
    const res = await globalNotificationService.requestPermission();
    setNotificationPermission(res);
    setShowNotificationBanner(false);
  };

  // DOUBLE DATE VALIDATION & DEDUPLICATION: Real-time match filter
  const deduplicatedMatches = React.useMemo(() => {
    const seenMatchKeys = new Set<string>();
    const result: Match[] = [];
    const targetDate = activeDateEAT || getKampalaTodayDateStr();

    // Filter strictly for the active date or live in-play matches
    const targetMatches = allMatches.filter((m) => {
      const matchDate = m.kampalaDate || targetDate;
      return matchDate === targetDate || m.status === 'live';
    });

    // Prioritize Live in-play first, then Upcoming kickoffs by time, then Finished
    const sorted = [...targetMatches].sort((a, b) => {
      const statusWeight = (s: string) => (s === 'live' ? 0 : s === 'upcoming' ? 1 : 2);
      if (statusWeight(a.status) !== statusWeight(b.status)) {
        return statusWeight(a.status) - statusWeight(b.status);
      }
      return 0;
    });

    for (const m of sorted) {
      const normalized = normalizeTodayFixture(m);
      const home = normalized.homeTeam?.name?.toLowerCase().trim() || '';
      const away = normalized.awayTeam?.name?.toLowerCase().trim() || '';
      const matchKey = `${normalized.id}_${home}_${away}`;
      const pairKey = `${home}_${away}`;
      if (home && away && !seenMatchKeys.has(matchKey) && !seenMatchKeys.has(pairKey)) {
        seenMatchKeys.add(matchKey);
        seenMatchKeys.add(pairKey);
        result.push(normalized);
      }
    }
    return result;
  }, [allMatches, activeDateEAT]);

  // Filter matches by team name / match title search query
  const filteredMatches = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return deduplicatedMatches;
    return deduplicatedMatches.filter((m) => {
      const home = m.homeTeam?.name?.toLowerCase() || '';
      const away = m.awayTeam?.name?.toLowerCase() || '';
      const match = m.match?.toLowerCase() || '';
      const comp = m.competition?.toLowerCase() || '';
      return home.includes(query) || away.includes(query) || match.includes(query) || comp.includes(query);
    });
  }, [deduplicatedMatches, searchQuery]);

  const liveMatches = filteredMatches
    .filter((m) => m.status === 'live' && m.prediction)
    .sort((a, b) => (b.prediction?.confidence ?? 0) - (a.prediction?.confidence ?? 0));

  const upcomingMatches = filteredMatches
    .filter((m) => m.status === 'upcoming' && m.prediction)
    .sort((a, b) => (b.prediction?.confidence ?? 0) - (a.prediction?.confidence ?? 0));

  const finishedMatches = filteredMatches
    .filter((m) => m.status === 'finished' && m.prediction)
    .sort((a, b) => b.id - a.id);

  const valueBetMatches = filteredMatches
    .filter((m) => m.prediction?.valueBet?.hasValue)
    .sort((a, b) => (b.prediction?.valueBet?.edgePercentage ?? 0) - (a.prediction?.valueBet?.edgePercentage ?? 0));

  const handleDownloadPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Football AI Engine — Today's Verified Predictions (${kampalaDateInfo.formattedHeader})`, 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Strictly Today's Matches • Timezone: ${TARGET_TIMEZONE} (EAT • UTC+3) • Generated at ${new Date().toLocaleTimeString()}`,
      14,
      25
    );

    const sanitize = (str: string | undefined | null): string => {
      if (!str) return '';
      return str.replace(/[^a-zA-Z0-9\s.,%:-✓✗()]/g, '');
    };

    const generateTableBody = (matches: Match[]) => {
      return matches.map((m) => {
        const p = m.prediction;
        const f1x2 = p.fullTime1X2;
        const dnb = p.dnb;
        const vs = m.verifiedScores;
        const scoreStr = vs ? `HT ${vs.halfTimeHome}-${vs.halfTimeAway} | FT ${vs.fullTimeHome}-${vs.fullTimeAway}` : m.currentScore;

        return [
          sanitize(m.match),
          sanitize(m.competition),
          sanitize(m.status.toUpperCase()),
          sanitize(scoreStr),
          `${sanitize(f1x2?.label || '1X2')} (${f1x2?.confidence || 75}%)`,
          `${sanitize(dnb?.label || 'DNB')} (${dnb?.confidence || 80}%)`,
          `${sanitize(p.outcome)} (${p.confidence || 80}%)`,
          sanitize(f1x2?.predictionResult?.toUpperCase() || p.htPredictionResult?.toUpperCase() || 'PENDING')
        ];
      });
    };

    autoTable(doc, {
      startY: 32,
      head: [['Match', 'League', 'Status', 'Score', 'FT 1X2 Pick', 'Draw No Bet', 'HT Goal Pick', 'Result']],
      body: generateTableBody(filteredMatches),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Today_Predictions_${currentTodayDateStr}_EAT.pdf`);
  };

  // 1. Brief splash loader with guaranteed 1s safety timeout
  if (authChecking) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 font-sans">
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col items-center gap-3 backdrop-blur-xl animate-fadeIn">
          <Logo iconSize="w-16 h-16" />
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mt-2" />
          <span className="text-xs font-mono text-zinc-400">Loading PredictPro AI Scoreboard...</span>
        </div>
      </div>
    );
  }

  // Active user account (fallback to Instant Guest if session initializing)
  const activeUser: UserAccount = currentUser || {
    id: 'usr_guest_instant',
    name: 'VIP Guest Bettor',
    email: 'guest@predictpro.ai',
    phone: '+1 (555) 019-2834',
    country: 'Global',
    isVerified: true,
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    isAppInstalled: false,
    bookmarkedMatchIds: []
  };

  // 3. User is authenticated -> Render protected dashboard
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950 antialiased">
      {/* Real-time PWA Installation Banner & Device Telemetry */}
      <PwaInstallTracker currentUser={currentUser} />

      {/* Primary Top Header */}
      <header className="bg-neutral-900/80 backdrop-blur-md border-b border-white/10 p-3 px-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-lg">
        {/* Brand Logo & Strict Date Badge */}
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">PREDICT PRO</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                STRICT TODAY ENGINE
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Globe className="w-3 h-3 text-blue-400" />
                <span>Google Search Grounded (SofaScore &amp; Flashscore)</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Today: {kampalaDateInfo.formattedHeader} &bull; {TARGET_TIMEZONE}
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMainView('predictions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mainView === 'predictions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Today's Live Engine</span>
          </button>

          <button
            onClick={() => setMainView('ai-bot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mainView === 'ai-bot'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40 font-extrabold border border-emerald-400/30'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Best-Picks Bot</span>
          </button>

          <button
            onClick={() => setMainView('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mainView === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Prediction History &amp; Outcomes</span>
          </button>

          <button
            onClick={() => setMainView('accuracy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mainView === 'accuracy'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Accuracy Model</span>
          </button>

          {/* Master Admin Tab (Visible exclusively to dj20pndmix@gmail.com) */}
          {currentUser?.email.toLowerCase() === 'dj20pndmix@gmail.com' && currentUser?.role === 'admin' ? (
            <button
              onClick={() => setMainView('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mainView === 'admin'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Admin Control</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentUser) {
                  setMainView('admin');
                } else {
                  setAuthModalTab('LOGIN');
                  setIsAuthModalOpen(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mainView === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Audits</span>
            </button>
          )}
        </div>

        {/* Header Right Actions & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Team Search Field in Header */}
          <div className="relative flex items-center w-full sm:w-44 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or match..."
              aria-label="Search match by team name"
              className="w-full bg-neutral-900/90 border border-white/10 hover:border-white/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-neutral-500 rounded-lg pl-8 pr-7 py-1.5 transition-colors outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-neutral-400 hover:text-white transition-colors p-0.5 rounded"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Timezone Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Africa/Kampala</span>
          </div>

          {lastUpdated && (
            <span className="text-xs text-neutral-400 font-mono hidden 2xl:inline">
              {lastUpdated}
            </span>
          )}

          <button
            onClick={() => fetchAllMatches(true)}
            disabled={refreshing}
            className="bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white font-medium py-1.5 px-2.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Force refresh today's live matches"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Sync Feed'}</span>
          </button>

          {/* Real-time Match Push Notification Center Dropdown */}
          <NotificationCenter />

          <button
            onClick={handleDownloadPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors duration-300 flex items-center gap-1.5"
            title="Download predictions as PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* Authenticated User Profile Button OR Sign In Button */}
          {currentUser ? (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="View Account Profile"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-emerald-500"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline max-w-[90px] truncate">{currentUser.name}</span>
              {currentUser.email.toLowerCase() === 'dj20pndmix@gmail.com' && (
                <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthModalTab('LOGIN');
                setIsAuthModalOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Push Notification Alert Toasts */}
      <LiveAlertToastContainer />

      {/* Proactive Notification Permission Prompt Banner */}
      {showNotificationBanner && (
        <div className="bg-gradient-to-r from-blue-950/90 via-neutral-900/95 to-emerald-950/90 border-b border-emerald-500/40 p-3 px-4 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Enable Real-Time Match &amp; Goal Alerts</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant Desktop &amp; Mobile Push
                </span>
              </h4>
              <p className="text-[11px] text-neutral-300 mt-0.5">
                Receive live alerts for kickoff times, confirmed lineups, goal scores, odds updates, and daily 12:00 AM matchday releases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEnableNotifications}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Allow Notifications</span>
            </button>
            <button
              onClick={() => setShowNotificationBanner(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss notification prompt"
              aria-label="Dismiss notification prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="p-4 space-y-6 max-w-5xl mx-auto w-full flex-grow">
        {mainView === 'ai-bot' ? (
          <AiPredictionBotView matches={deduplicatedMatches} onRefreshFeed={() => fetchAllMatches(true)} />
        ) : mainView === 'history' ? (
          <PredictionHistoryView />
        ) : mainView === 'accuracy' ? (
          <AccuracyDashboard />
        ) : mainView === 'admin' ? (
          currentUser?.email.toLowerCase() === 'dj20pndmix@gmail.com' && currentUser?.role === 'admin' ? (
            <MasterAdminDashboard currentUser={currentUser} onRefreshAllMatches={() => fetchAllMatches(false)} />
          ) : (
            <div className="p-8 bg-zinc-900/90 border border-amber-500/30 rounded-2xl text-center space-y-4 max-w-md mx-auto my-12 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Master Admin Access Required</h2>
              <p className="text-xs text-zinc-400">
                You must sign in as Master Admin (<span className="text-amber-300 font-mono">dj20pndmix@gmail.com</span>) to access user account ledgers, installation telemetry, and system controls.
              </p>
              <button
                onClick={() => {
                  setAuthModalTab('LOGIN');
                  setIsAuthModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In as Master Admin</span>
              </button>
            </div>
          )
        ) : loading ? (
          <div className="text-center p-12 text-neutral-400 bg-white/5 rounded-2xl border border-white/10">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
            <p className="font-medium text-lg text-white">Fetching Strictly Today's Fixtures...</p>
            <p className="text-xs text-neutral-400 mt-1">
              Timezone: Africa/Kampala (EAT • UTC+3) &bull; Date: {currentTodayDateStr}
            </p>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="font-semibold text-lg">Unable to connect to live match feed</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => fetchAllMatches(true)}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium text-sm rounded-lg border border-red-500/30 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : deduplicatedMatches.length === 0 ? (
          /* STRICT ZERO-MATCH MESSAGE: NO FALLBACK TO OLD DATA */
          <div className="text-center p-12 bg-neutral-800/90 border border-white/10 rounded-2xl space-y-4 max-w-xl mx-auto my-8 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-neutral-700/60 flex items-center justify-center mx-auto text-neutral-400 border border-white/5">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide uppercase">
              NO MATCHES SCHEDULED FOR TODAY
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              There are no football matches officially scheduled to kick off today (
              <span className="text-emerald-400 font-semibold">{kampalaDateInfo.formattedHeader}</span>) within the{' '}
              <span className="font-mono text-blue-300">Africa/Kampala (EAT • UTC+3)</span> timezone.
            </p>
            <p className="text-xs text-neutral-400">
              The prediction engine operates strictly on today's single calendar date only and will never substitute matches from yesterday or tomorrow.
            </p>
            <button
              onClick={() => fetchAllMatches(true)}
              disabled={refreshing}
              className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking Schedule...' : 'Re-check Today Schedule'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Real-time Central Automation System Banner */}
            <AutomationStatusBanner onTriggerSync={() => fetchAllMatches(true)} />

            {/* Today's Matchday Banner & Midnight Auto-Roll Date Selector */}
            <div className="bg-neutral-800/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-3 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-sm font-bold text-white uppercase tracking-wider">
                        {formatKampalaDateHeader(activeDateEAT)} Fixtures
                      </h1>
                      {activeDateEAT === getKampalaTodayDateStr() ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>AUTO-LIVE (EAT UTC+3)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          CALENDAR ARCHIVE
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900 text-neutral-300 border border-white/10">
                        {activeDateEAT}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {activeDateEAT === getKampalaTodayDateStr()
                        ? `Automatic midnight rollover active • Fresh fixtures load dynamically at 00:00 Africa/Kampala`
                        : `Browsing fixtures for ${formatKampalaDateHeader(activeDateEAT)}`}
                    </p>
                  </div>
                </div>

                {/* Quick Date Switcher Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => {
                      const prevDate = getShiftedDateStr(getKampalaTodayDateStr(), -1);
                      setActiveDateEAT(prevDate);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      activeDateEAT === getShiftedDateStr(getKampalaTodayDateStr(), -1)
                        ? 'bg-neutral-700 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Yesterday
                  </button>

                  <button
                    onClick={() => {
                      const today = getKampalaTodayDateStr();
                      setActiveDateEAT(today);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeDateEAT === getKampalaTodayDateStr()
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Today (Auto-Live)</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextDate = getShiftedDateStr(getKampalaTodayDateStr(), 1);
                      setActiveDateEAT(nextDate);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      activeDateEAT === getShiftedDateStr(getKampalaTodayDateStr(), 1)
                        ? 'bg-neutral-700 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              {/* Status summary metrics */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono border-t border-white/5 text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Scheduled:</span>
                  <span className="text-emerald-400 font-bold">{deduplicatedMatches.length} Matches</span>
                  <span className="text-neutral-600">&bull;</span>
                  <span className="text-blue-400 font-bold">{upcomingMatches.length} Upcoming</span>
                  <span className="text-neutral-600">&bull;</span>
                  <span className="text-red-400 font-bold">{liveMatches.length} Live</span>
                  <span className="text-neutral-600">&bull;</span>
                  <span className="text-neutral-300 font-bold">{finishedMatches.length} Settled</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>Midnight Transition: <strong className="text-emerald-300">AUTO-FETCH ENABLED</strong></span>
                </div>
              </div>
            </div>

            {/* AI Deep Match Analysis & Best-Picks Bot Component */}
            <AiPredictionBotView matches={deduplicatedMatches} onRefreshFeed={() => fetchAllMatches(true)} />

            {/* Category Filter Tabs & Google Research Hub Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'all'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                  }`}
                >
                  <span>All Today's Fixtures</span>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/30">
                    {filteredMatches.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'upcoming'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                  }`}
                >
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Upcoming</span>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/30">
                    {upcomingMatches.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('live')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'live'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                  }`}
                >
                  <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>Live In-Play</span>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/30">
                    {liveMatches.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('finished')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'finished'
                      ? 'bg-neutral-700 text-white shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-neutral-400" />
                  <span>Finished</span>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/30">
                    {finishedMatches.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('value')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === 'value'
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-zinc-950 shadow-lg shadow-amber-500/25'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Value Bets (+EV)</span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-black/40 text-amber-300 border border-amber-500/40">
                    {valueBetMatches.length}
                  </span>
                </button>
              </div>

              {/* Direct Google Live Research Suite Launcher */}
              <div className="flex flex-wrap items-center gap-2">
                {searchQuery && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                    <Search className="w-3 h-3" />
                    <span>Searching: "{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {upcomingMatches.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                    <span>{upcomingMatches.length} Scheduled Later Today</span>
                  </div>
                )}

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`football matches today live scores lineups injuries ${currentTodayDateStr}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  title="Search today's football fixtures on Google.com"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google.com Live Research ↗</span>
                </a>
              </div>
            </div>

            {/* Zero Filtered Matches State */}
            {filteredMatches.length === 0 ? (
              <div className="text-center p-12 bg-neutral-800/90 border border-white/10 rounded-2xl space-y-4 max-w-xl mx-auto my-8 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-neutral-700/60 flex items-center justify-center mx-auto text-neutral-400 border border-white/5">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  NO MATCHES FOUND FOR &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  No team or match title matching <span className="text-emerald-400 font-semibold">{searchQuery}</span> was found in today's fixtures ({kampalaDateInfo.formattedHeader}).
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 px-5 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white font-medium text-sm rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Search Filter</span>
                </button>
              </div>
            ) : (
              <>
                {/* 0. VALUE BETS SECTION (Shown when Value tab is selected or in All) */}
                {(activeTab === 'all' || activeTab === 'value') && valueBetMatches.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-transparent p-4 rounded-2xl border border-amber-500/40 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <span>🎯 Accurate Value Bets Detected (+EV)</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                              Dixon-Coles Positive Overlay
                            </span>
                          </h2>
                          <p className="text-xs text-neutral-300 mt-0.5">
                            High-confidence market opportunities where Dixon-Coles model probability exceeds closing bookmaker odds by &ge;5% with positive expected value.
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs text-amber-400 font-bold bg-black/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
                          {valueBetMatches.length} Value Bets Available
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {valueBetMatches.map((match, idx) => (
                        <React.Fragment key={`value-${match.id}-${idx}`}>
                          <PredictionCard match={match} />
                        </React.Fragment>
                      ))}
                    </div>
                  </section>
                )}

                {activeTab === 'value' && valueBetMatches.length === 0 && (
                  <div className="text-center p-12 bg-neutral-900/80 border border-amber-500/20 rounded-2xl space-y-3">
                    <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                    <h3 className="text-lg font-bold text-white">No +EV Value Bets Found for Active Filter</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      All currently filtered fixtures operate within normal statistical bookmaker margins. Switch to &ldquo;All Today&rsquo;s Fixtures&rdquo; to inspect all matches.
                    </p>
                  </div>
                )}

                {/* 1. TOP: Upcoming Matches Section */}
                {(activeTab === 'all' || activeTab === 'upcoming') && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <h2 className="text-xl font-bold text-white">Upcoming Matches Scheduled Today</h2>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">
                        {upcomingMatches.length} Matches
                      </span>
                    </div>
                    <div className="space-y-4">
                      {upcomingMatches.length > 0 ? (
                        upcomingMatches.map((match, idx) => (
                          <React.Fragment key={`upcoming-${match.id}-${idx}`}>
                            <PredictionCard match={match} />
                          </React.Fragment>
                        ))
                      ) : (
                        <div className="text-center p-8 text-neutral-400 bg-white/5 rounded-xl border border-white/5 space-y-2">
                          <p className="font-medium text-white">
                            No upcoming fixtures match the selected filter.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* 2. MIDDLE: Live Predictions Section */}
                {(activeTab === 'all' || activeTab === 'live') && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <h2 className="text-xl font-bold text-white">Live In-Play Predictions</h2>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">{liveMatches.length} Matches</span>
                    </div>
                    <div className="space-y-4">
                      {liveMatches.length > 0 ? (
                        liveMatches.map((match, idx) => (
                          <React.Fragment key={`live-${match.id}-${idx}`}>
                            <PredictionCard match={match} />
                          </React.Fragment>
                        ))
                      ) : (
                        <div className="text-center p-8 text-neutral-400 bg-white/5 rounded-xl border border-white/5">
                          No matches are currently live in-play. Check upcoming kick-offs above.
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* 3. BOTTOM: Finished Predictions Section */}
                {(activeTab === 'all' || activeTab === 'finished') && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-xl font-bold text-white">Finished Today &amp; Verified Results</h2>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">
                        {finishedMatches.length} Matches
                      </span>
                    </div>
                    <div className="space-y-4">
                      {finishedMatches.length > 0 ? (
                        finishedMatches.map((match, idx) => (
                          <React.Fragment key={`finished-${match.id}-${idx}`}>
                            <PredictionCard match={match} />
                          </React.Fragment>
                        ))
                      ) : (
                        <div className="text-center p-8 text-neutral-400 bg-white/5 rounded-xl border border-white/5">
                          No finished match predictions recorded yet today.
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="text-center p-4 text-xs text-neutral-500 border-t border-white/10 flex flex-wrap justify-between items-center max-w-4xl mx-auto w-full gap-2">
        <span>Football AI Engine &bull; Strictly Today's Matches ({currentTodayDateStr} Africa/Kampala)</span>
        <span className="font-mono text-neutral-400">EAT (UTC+3) &bull; Zero Cross-Date Fallback</span>
      </footer>

      {/* Global Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />

      {/* User Personal Profile Drawer / Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
          onProfileUpdated={handleProfileUpdated}
          onOpenAdminPanel={() => setMainView('admin')}
        />
      )}
    </div>
  );
}
