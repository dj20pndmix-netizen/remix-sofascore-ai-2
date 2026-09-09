/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PredictPro AI Deep Match Analysis & Best-Picks Bot Dashboard
 * Renders batch multi-model analysis, live progress tracker,
 * ranked best-picks table, and deep intelligence audit modal.
 */

import React, { useState, useEffect } from 'react';
import type { Match, AnalysisSnapshot, QualifiedPick, AiBotJobProgress } from '../types';
import {
  Bot,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  Layers,
  BarChart2,
  Calendar,
  Eye,
  X,
  Flame,
  Activity,
  ChevronDown
} from 'lucide-react';

import {
  RotateCcw
} from 'lucide-react';

interface AiPredictionBotViewProps {
  matches: Match[];
  onRefreshFeed?: () => void;
}

export function evaluatePickOutcome(
  pick: QualifiedPick,
  matchObj?: Match
): { outcome: 'WON' | 'LOST' | 'VOID' | 'LIVE' | 'UPCOMING'; scoreString: string } {
  if (!matchObj) {
    if (pick.reconciliation?.outcome) {
      const recOutcome = pick.reconciliation.outcome;
      return { 
        outcome: recOutcome === 'PENDING' ? 'UPCOMING' : recOutcome, 
        scoreString: pick.reconciliation.settledScore || 'FT' 
      };
    }
    return { outcome: 'UPCOMING', scoreString: '-:-' };
  }

  if (matchObj.status === 'live') {
    return { outcome: 'LIVE', scoreString: matchObj.currentScore || "1'" };
  }

  if (matchObj.status !== 'finished' && matchObj.time !== 'FT') {
    return { outcome: 'UPCOMING', scoreString: '-:-' };
  }

  const score = matchObj.currentScore || '0-0';
  const [ftH, ftA] = score.split('-').map((s) => parseInt(s.trim(), 10));
  const h = isNaN(ftH) ? 0 : ftH;
  const a = isNaN(ftA) ? 0 : ftA;

  const mType = pick.marketType;
  const pickText = (pick.pick || '').toLowerCase();

  // Match Winner (1X2)
  if (mType === '1X2') {
    if (pickText.includes('home') || pick.pick === '1' || pickText.includes(matchObj.homeTeam.name.toLowerCase())) {
      return { outcome: h > a ? 'WON' : 'LOST', scoreString: score };
    }
    if (pickText.includes('away') || pick.pick === '2' || pickText.includes(matchObj.awayTeam.name.toLowerCase())) {
      return { outcome: a > h ? 'WON' : 'LOST', scoreString: score };
    }
    if (pickText.includes('draw') || pick.pick === 'X') {
      return { outcome: h === a ? 'WON' : 'LOST', scoreString: score };
    }
  }

  // Draw No Bet
  if (mType === 'DNB') {
    if (h === a) {
      return { outcome: 'VOID', scoreString: score };
    }
    if (pickText.includes('home') || pick.pick === '1' || pickText.includes(matchObj.homeTeam.name.toLowerCase())) {
      return { outcome: h > a ? 'WON' : 'LOST', scoreString: score };
    }
    if (pickText.includes('away') || pick.pick === '2' || pickText.includes(matchObj.awayTeam.name.toLowerCase())) {
      return { outcome: a > h ? 'WON' : 'LOST', scoreString: score };
    }
  }

  // Double Chance
  if (mType === 'DOUBLE_CHANCE') {
    if (pick.pick.includes('1X')) return { outcome: h >= a ? 'WON' : 'LOST', scoreString: score };
    if (pick.pick.includes('X2')) return { outcome: a >= h ? 'WON' : 'LOST', scoreString: score };
    if (pick.pick.includes('12')) return { outcome: h !== a ? 'WON' : 'LOST', scoreString: score };
  }

  // Over/Under Goals
  if (mType === 'OVER_UNDER_GOALS' || pickText.includes('over') || pickText.includes('under')) {
    const total = h + a;
    if (pickText.includes('over 1.5')) return { outcome: total > 1.5 ? 'WON' : 'LOST', scoreString: score };
    if (pickText.includes('under 1.5')) return { outcome: total < 1.5 ? 'WON' : 'LOST', scoreString: score };
    if (pickText.includes('over 2.5')) return { outcome: total > 2.5 ? 'WON' : 'LOST', scoreString: score };
    if (pickText.includes('under 2.5')) return { outcome: total < 2.5 ? 'WON' : 'LOST', scoreString: score };
  }

  // Both Teams To Score
  if (mType === 'BTTS') {
    const isBtts = h > 0 && a > 0;
    if (pickText.includes('yes')) return { outcome: isBtts ? 'WON' : 'LOST', scoreString: score };
    if (pickText.includes('no')) return { outcome: !isBtts ? 'WON' : 'LOST', scoreString: score };
  }

  if (h > a && (pickText.includes('home') || pick.pick === '1')) return { outcome: 'WON', scoreString: score };
  if (a > h && (pickText.includes('away') || pick.pick === '2')) return { outcome: 'WON', scoreString: score };
  if (h === a && (pickText.includes('draw') || pick.pick === 'X')) return { outcome: 'WON', scoreString: score };

  return { outcome: 'LOST', scoreString: score };
}

export const AiPredictionBotView: React.FC<AiPredictionBotViewProps> = ({ matches, onRefreshFeed }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<AiBotJobProgress | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [allSnapshots, setAllSnapshots] = useState<AnalysisSnapshot[]>([]);
  const [selectedPick, setSelectedPick] = useState<QualifiedPick | null>(null);
  const [pickLimit, setPickLimit] = useState<number>(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);

  // Load latest snapshot on mount
  useEffect(() => {
    fetchLatestSnapshot();
    fetchSnapshotsHistory();
  }, []);

  const fetchLatestSnapshot = async () => {
    try {
      const res = await fetch('/api/ai-bot/latest');
      const data = await res.json();
      if (data.success && data.snapshot) {
        setLatestSnapshot(data.snapshot);
      }
    } catch (err) {
      console.warn('Failed to load latest AI bot snapshot:', err);
    }
  };

  const fetchSnapshotsHistory = async () => {
    try {
      const res = await fetch('/api/ai-bot/snapshots');
      const data = await res.json();
      if (data.success && Array.isArray(data.snapshots)) {
        setAllSnapshots(data.snapshots);
      }
    } catch (err) {
      console.warn('Failed to load snapshots history:', err);
    }
  };

  // Poll progress when running
  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(async () => {
        try {
          const res = await fetch('/api/ai-bot/status');
          const data = await res.json();
          if (data.success && data.progress) {
            setProgress(data.progress);
            if (data.progress.status === 'COMPLETED' || data.progress.status === 'FAILED') {
              setIsRunning(false);
              fetchLatestSnapshot();
              fetchSnapshotsHistory();
            }
          }
        } catch (e) {
          console.warn('Error polling AI bot progress:', e);
        }
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const handleRunAnalysis = async () => {
    if (matches.length === 0) {
      setErrorMessage('No matches currently loaded in the application to analyze.');
      return;
    }

    setErrorMessage(null);
    setIsRunning(true);
    setProgress({
      jobId: `job-${Date.now()}`,
      status: 'RUNNING',
      stage: 'LOCKING_FIXTURES',
      stageDescription: `Locking ${matches.length} application fixtures...`,
      progressPercent: 5,
      completedMatches: 0,
      totalMatches: matches.length
    });

    try {
      const res = await fetch('/api/ai-bot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureIds: matches.map((m) => m.id),
          limit: pickLimit,
          forceRefresh: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI analysis request failed.');
      }

      setLatestSnapshot(data.snapshot);
      fetchSnapshotsHistory();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred during AI analysis run.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO AI PREDICTION BOT PANEL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-emerald-950/40 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-extrabold tracking-wide">
                <Bot className="w-4 h-4 animate-pulse" />
                <span>AI PREDICTION BOT</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-bold">
                6-MODEL ENSEMBLE + VALUE EDGE
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 border border-white/10 text-xs font-mono">
                {matches.length} Fixtures In App
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Deep Match Analysis &amp; Best-Picks Engine</span>
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Synthesizes <strong className="text-white">Bivariate Poisson</strong>, <strong className="text-white">Dixon-Coles</strong> low-score adjustments, <strong className="text-white">Elo strength</strong>, <strong className="text-white">xG metrics</strong>, and <strong className="text-white">Google Search Grounded tactical absence audits</strong>. Compares all {matches.length} matches, filters risk, and ranks the highest-value opportunities.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Strict Fixture Whitelist</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span>Bookmaker Implied Value Edge</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero Fabricated Data</span>
              </span>
            </div>
          </div>

          {/* Action Button & Pick Limit Select */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-black/40 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-neutral-400 px-2">Picks:</span>
              {[3, 5, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setPickLimit(num)}
                  disabled={isRunning}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    pickLimit === num
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Top {num}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isRunning || matches.length === 0}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
                isRunning
                  ? 'bg-neutral-800 text-neutral-400 border border-white/10 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/60 border border-emerald-400/40 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>ANALYZING {matches.length} MATCHES...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>RUN AI ANALYSIS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* LIVE PROGRESS STAGES DURING ANALYSIS */}
        {isRunning && progress && (
          <div className="mt-6 pt-5 border-t border-white/10 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{progress.stageDescription}</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {progress.completedMatches} / {progress.totalMatches} Matches
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(10, progress.progressPercent)}%` }}
              ></div>
            </div>

            {/* Active Stages Step Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[10px] font-mono text-neutral-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. Whitelist Locked</span>
              </div>
              <div className={`flex items-center gap-1.5 ${['RESEARCHING_INTEL', 'RUNNING_MODELS', 'EVALUATING_MARKETS', 'FILTERING_RISK', 'RANKING_PICKS', 'DONE'].includes(progress.stage) ? 'text-emerald-400' : 'text-neutral-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. Search Intel</span>
              </div>
              <div className={`flex items-center gap-1.5 ${['RUNNING_MODELS', 'EVALUATING_MARKETS', 'FILTERING_RISK', 'RANKING_PICKS', 'DONE'].includes(progress.stage) ? 'text-emerald-400' : 'text-neutral-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3. 6 Models</span>
              </div>
              <div className={`flex items-center gap-1.5 ${['EVALUATING_MARKETS', 'FILTERING_RISK', 'RANKING_PICKS', 'DONE'].includes(progress.stage) ? 'text-emerald-400' : 'text-neutral-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4. Value Edge</span>
              </div>
              <div className={`flex items-center gap-1.5 ${['RANKING_PICKS', 'DONE'].includes(progress.stage) ? 'text-emerald-400' : 'text-neutral-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>5. Top Ranked</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RESULTS HEADER & SNAPSHOT VERSION INFO */}
      {latestSnapshot && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 border border-white/10 rounded-xl p-3 px-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  AI BEST PICKS &bull; {latestSnapshot.kampalaDate}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {latestSnapshot.qualifiedCount} QUALIFIED PICKS
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Audited {latestSnapshot.totalAnalyzed} locked matches &bull; Snapshot #{latestSnapshot.analysisId.split('-').pop()} &bull;{' '}
                {new Date(latestSnapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Historical Version Selector */}
          {allSnapshots.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Snapshots ({allSnapshots.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showHistoryDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-white/15 rounded-xl shadow-2xl p-1.5 z-30 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-white/5">
                    Past Analysis Snapshots
                  </div>
                  {allSnapshots.map((snap) => (
                    <button
                      key={snap.analysisId}
                      onClick={() => {
                        setLatestSnapshot(snap);
                        setShowHistoryDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                        latestSnapshot.analysisId === snap.analysisId
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                          : 'hover:bg-white/5 text-neutral-300'
                      }`}
                    >
                      <span>#{snap.analysisId.split('-').pop()} ({snap.qualifiedCount} picks)</span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* NO QUALIFIED PICKS BANNER */}
      {latestSnapshot && latestSnapshot.topPicks.length === 0 && (
        <div className="p-8 rounded-2xl bg-neutral-900/90 border border-amber-500/30 text-center space-y-3 shadow-xl max-w-xl mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            NO QUALIFIED PICKS
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {latestSnapshot.noPickReason ||
              `The AI analyzed all ${latestSnapshot.totalAnalyzed} application fixtures but did not find any opportunity meeting the required 78% confidence and positive market edge under current risk conditions.`}
          </p>
          <p className="text-[11px] text-neutral-400">
            Predictions are never manufactured simply to fill the table. Standards are strictly maintained.
          </p>
        </div>
      )}

      {/* RANKED BEST-PICKS TABLE */}
      {latestSnapshot && latestSnapshot.topPicks.length > 0 && (
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-800/80 border-b border-white/10 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-14">Rank</th>
                  <th className="py-3 px-4">Match &amp; Competition</th>
                  <th className="py-3 px-4">AI Recommended Pick</th>
                  <th className="py-3 px-4 text-center">Odds</th>
                  <th className="py-3 px-4 text-center">AI Confidence</th>
                  <th className="py-3 px-4 text-center">Value / Edge</th>
                  <th className="py-3 px-4 text-center">Result Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {latestSnapshot.topPicks.map((pick) => {
                  const isTopRank = pick.rank === 1;
                  const matchObj = matches.find((m) => m.id === pick.matchId);
                  const outcomeInfo = evaluatePickOutcome(pick, matchObj);

                  return (
                    <tr
                      key={pick.id}
                      onClick={() => setSelectedPick(pick)}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer group ${
                        isTopRank ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Rank Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                            pick.rank === 1
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-md'
                              : pick.rank === 2
                              ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-zinc-950'
                              : pick.rank === 3
                              ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200'
                              : 'bg-neutral-800 text-neutral-300 border border-white/10'
                          }`}
                        >
                          #{pick.rank}
                        </span>
                      </td>

                      {/* Match Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm group-hover:text-emerald-400 transition-colors">
                            <span>{pick.homeTeam.name}</span>
                            <span className="text-neutral-500 font-normal">vs</span>
                            <span>{pick.awayTeam.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                            <span>{pick.competition}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-neutral-300">{pick.kickoffTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* Pick Market & Selection */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{pick.pick}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            Market: {pick.marketName}
                          </p>
                        </div>
                      </td>

                      {/* Odds */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-xs text-white">
                        <span className="px-2 py-1 rounded bg-black/40 border border-white/10">
                          {pick.odds}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="space-y-1">
                          <span className="inline-block font-extrabold text-xs text-emerald-400 font-mono">
                            {pick.confidence}%
                          </span>
                          <div className="w-16 bg-neutral-800 rounded-full h-1.5 mx-auto overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${pick.confidence}%` }}
                            ></div>
                          </div>
                          <p className="text-[9px] text-neutral-400 font-mono">
                            {pick.modelAgreement}% Consensus
                          </p>
                        </div>
                      </td>

                      {/* Value / Edge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            pick.edgePercentage > 4
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>+{pick.edgePercentage}% Edge</span>
                        </span>
                      </td>

                      {/* Result Status: Auto Won / Lost Settlement */}
                      <td className="py-3.5 px-4 text-center">
                        {outcomeInfo.outcome === 'WON' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-black text-xs shadow-md shadow-emerald-950/40 animate-in fade-in duration-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WON ({outcomeInfo.scoreString})</span>
                          </span>
                        ) : outcomeInfo.outcome === 'LOST' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/25 text-rose-300 border border-rose-500/50 font-black text-xs shadow-md shadow-rose-950/40 animate-in fade-in duration-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>LOST ({outcomeInfo.scoreString})</span>
                          </span>
                        ) : outcomeInfo.outcome === 'VOID' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/25 text-amber-300 border border-amber-500/50 font-black text-xs shadow-md shadow-amber-950/40">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span>VOID ({outcomeInfo.scoreString})</span>
                          </span>
                        ) : outcomeInfo.outcome === 'LIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            <span>LIVE ({outcomeInfo.scoreString})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-white/10 text-[11px] font-semibold">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>PENDING FT</span>
                          </span>
                        )}
                      </td>

                      {/* Inspect Details Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPick(pick);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-white/10"
                        >
                          <span>Audit</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED INTELLIGENCE MODAL */}
      {selectedPick && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    RANK #{selectedPick.rank} BEST PICK
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {selectedPick.competition}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedPick.homeTeam.name} vs {selectedPick.awayTeam.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPick(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Recommendation Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-neutral-800/80 to-teal-950/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                  Recommended Market Selection
                </p>
                <div className="text-base sm:text-lg font-black text-emerald-300 mt-0.5">
                  {selectedPick.pick}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Market: {selectedPick.marketName} &bull; Kickoff: {selectedPick.kickoffTime}
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <div className="text-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-neutral-400">Odds</div>
                  <div className="text-sm font-bold text-white">{selectedPick.odds}</div>
                </div>
                <div className="text-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-neutral-400">Model Prob</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {(selectedPick.modelProbability * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-neutral-400">Edge</div>
                  <div className="text-sm font-bold text-blue-400">
                    +{selectedPick.edgePercentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Model Probability Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                <span>6-Model Independent Probability Ensemble</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-white/5 space-y-1">
                  <div className="text-[10px] text-neutral-400">Model A: Bivariate Poisson</div>
                  <div className="text-white font-bold">
                    Home {(selectedPick.modelBreakdown.poisson.homeWin * 100).toFixed(0)}% / Draw {(selectedPick.modelBreakdown.poisson.draw * 100).toFixed(0)}% / Away {(selectedPick.modelBreakdown.poisson.awayWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    xG: {selectedPick.modelBreakdown.poisson.expectedGoalsHome} - {selectedPick.modelBreakdown.poisson.expectedGoalsAway}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-white/5 space-y-1">
                  <div className="text-[10px] text-neutral-400">Model B: Dixon-Coles</div>
                  <div className="text-white font-bold">
                    Home {(selectedPick.modelBreakdown.dixonColes.homeWin * 100).toFixed(0)}% / Draw {(selectedPick.modelBreakdown.dixonColes.draw * 100).toFixed(0)}% / Away {(selectedPick.modelBreakdown.dixonColes.awayWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-teal-400">Low-score adjusted</div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-white/5 space-y-1">
                  <div className="text-[10px] text-neutral-400">Model C: Elo Strength</div>
                  <div className="text-white font-bold">
                    Home {(selectedPick.modelBreakdown.elo.homeWin * 100).toFixed(0)}% / Draw {(selectedPick.modelBreakdown.elo.draw * 100).toFixed(0)}% / Away {(selectedPick.modelBreakdown.elo.awayWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-blue-400">
                    Diff: {selectedPick.modelBreakdown.elo.ratingDiff > 0 ? '+' : ''}{selectedPick.modelBreakdown.elo.ratingDiff} pts
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-white/5 space-y-1">
                  <div className="text-[10px] text-neutral-400">Model D: xG &amp; Conversion</div>
                  <div className="text-white font-bold">
                    Home {(selectedPick.modelBreakdown.xgModel.homeWin * 100).toFixed(0)}% / Draw {(selectedPick.modelBreakdown.xgModel.draw * 100).toFixed(0)}% / Away {(selectedPick.modelBreakdown.xgModel.awayWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-amber-400">Threat differential</div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-white/5 space-y-1">
                  <div className="text-[10px] text-neutral-400">Model E: Form Decay</div>
                  <div className="text-white font-bold">
                    Home {(selectedPick.modelBreakdown.formModel.homeWin * 100).toFixed(0)}% / Draw {(selectedPick.modelBreakdown.formModel.draw * 100).toFixed(0)}% / Away {(selectedPick.modelBreakdown.formModel.awayWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-purple-400">
                    Ratio: {selectedPick.modelBreakdown.formModel.momentumRatio}x
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-white/5 space-y-1">
                  <div className="text-[10px] text-neutral-400">Model F: Grounded Tactical</div>
                  <div className="text-white font-bold">
                    Home {(selectedPick.modelBreakdown.groundedAi.homeWin * 100).toFixed(0)}% / Draw {(selectedPick.modelBreakdown.groundedAi.draw * 100).toFixed(0)}% / Away {(selectedPick.modelBreakdown.groundedAi.awayWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-emerald-400">Absences &amp; Lineups</div>
                </div>
              </div>
            </div>

            {/* Supporting Factors */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Key Supporting Intel &amp; Drivers</span>
              </h4>
              <ul className="space-y-1.5">
                {selectedPick.supportingFactors.map((factor, i) => (
                  <li key={i} className="text-xs text-neutral-300 bg-neutral-800/50 p-2 rounded-lg border border-white/5">
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk & Absence Audit */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Squad Absences &amp; Risk Audit</span>
              </h4>
              <ul className="space-y-1.5">
                {selectedPick.riskFactors.map((risk, i) => (
                  <li key={i} className="text-xs text-neutral-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
              <span>Timestamp: {new Date(selectedPick.researchTimestamp).toLocaleString()}</span>
              <button
                onClick={() => setSelectedPick(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
