/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import type { Match, GroundedMatchIntel } from '../types';
import { Badge } from './Badge';
import { Stat } from './Stat';
import { SearchGroundingIntel } from './SearchGroundingIntel';
import {
  CheckCircle2,
  XCircle,
  Flame,
  ShieldCheck,
  Trophy,
  Sparkles,
  Target,
  Zap,
  Clock,
  HelpCircle,
  RotateCcw,
  Shield,
  Calendar,
  Globe,
  ExternalLink
} from 'lucide-react';

export function PredictionCard({ match }: { match: Match }) {
  if (!match.prediction) {
    return null;
  }

  const [activeView, setActiveView] = useState<'1x2' | 'dnb' | 'halftime' | 'value' | 'intel'>('1x2');
  const { prediction } = match;
  const f1x2 = prediction.fullTime1X2;
  const dnb = prediction.dnb;

  const confidence = prediction.confidence;
  const confidenceColor =
    typeof confidence === 'number' && confidence > 85
      ? 'text-emerald-400'
      : typeof confidence === 'number' && confidence > 75
      ? 'text-amber-400'
      : 'text-neutral-300';

  const homeStreak = match.homeTeam.unbeatenStreak || 'N/A';
  const awayStreak = match.awayTeam.unbeatenStreak || 'N/A';

  const ResultStatusBadge = ({
    status,
    marketLabel,
    marketType = '1x2'
  }: {
    status?: 'won' | 'lost' | 'void' | 'pending' | 'needs_review' | 'no_pick';
    marketLabel: string;
    marketType?: '1x2' | 'dnb' | 'halftime' | 'double_chance';
  }) => {
    if (match.status !== 'finished' && match.time !== 'FT') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-700/60 text-neutral-300 border border-white/10">
          <Clock className="w-3 h-3 text-neutral-400" /> Pending FT
        </span>
      );
    }

    // Auto-resolve outcome from match scores if status is missing
    let resolvedStatus: 'won' | 'lost' | 'void' | 'pending' | 'needs_review' | 'no_pick' | undefined = status;
    const vs = match.verifiedScores;
    const [scH, scA] = (match.currentScore || '').split('-').map(s => parseInt(s.trim(), 10));
    const ftH = vs?.fullTimeHome ?? (!isNaN(scH) ? scH : null);
    const ftA = vs?.fullTimeAway ?? (!isNaN(scA) ? scA : null);
    const htH = vs?.halfTimeHome ?? (ftH !== null ? Math.min(ftH, 1) : 0);
    const htA = vs?.halfTimeAway ?? 0;

    if (!resolvedStatus || resolvedStatus === 'pending') {
      if (ftH !== null && ftA !== null) {
        if (marketType === '1x2') {
          const actualPick = ftH > ftA ? '1' : ftA > ftH ? '2' : 'X';
          resolvedStatus = f1x2?.prediction === actualPick ? 'won' : 'lost';
        } else if (marketType === 'dnb') {
          if (ftH === ftA) {
            resolvedStatus = 'void';
          } else {
            const isHome = ftH > ftA;
            resolvedStatus = (isHome && dnb?.pick === '1') || (!isHome && dnb?.pick === '2') ? 'won' : 'lost';
          }
        } else if (marketType === 'halftime') {
          const htTotal = htH + htA;
          resolvedStatus = htTotal <= 1 ? 'won' : 'lost';
        }
      }
    }

    if (resolvedStatus === 'won') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-950/40 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{marketLabel} WON</span>
        </span>
      );
    }
    if (resolvedStatus === 'lost') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg bg-rose-500/25 text-rose-300 border border-rose-400/50 shadow-lg shadow-rose-950/40 animate-in fade-in duration-200">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{marketLabel} LOST</span>
        </span>
      );
    }
    if (resolvedStatus === 'void') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-lg shadow-amber-950/40 animate-in fade-in duration-200">
          <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{marketLabel} VOID (Push)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
        <HelpCircle className="w-3.5 h-3.5" /> Under Review
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral-800/70 rounded-xl border border-white/10 overflow-hidden text-sm shadow-md"
    >
      {/* Header */}
      <div className="p-4 bg-white/5 space-y-3">
        {/* League and Kickoff Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>{match.competition || 'Football Matchday'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-300 text-xs font-semibold bg-neutral-900/90 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{match.scheduledStartTime || match.time}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                className="w-8 h-8 rounded-full bg-neutral-900 p-0.5 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-semibold text-white">{match.homeTeam.name}</span>
              {match.homeTeam.unbeatenStreak && (
                <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 inline" /> {match.homeTeam.unbeatenStreak}
                </span>
              )}
            </div>
            <span className="text-neutral-400 font-bold px-1">vs</span>
            <div className="flex items-center gap-2">
              <img
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                className="w-8 h-8 rounded-full bg-neutral-900 p-0.5 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-semibold text-white">{match.awayTeam.name}</span>
              {match.awayTeam.unbeatenStreak && (
                <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-400 inline" /> {match.awayTeam.unbeatenStreak}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Automation & Lineup Telemetry Badges */}
            {match.lineupStatus === 'CONFIRMED' || match.groundedIntel?.homeLineup?.isConfirmed ? (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>XI: CONFIRMED</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-neutral-700/50 text-neutral-300 border border-white/10 flex items-center gap-1">
                <span>XI: PREDICTED</span>
              </span>
            )}

            {match.dataStatus === 'RECALCULATED' && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>AUTO-RECALCULATED</span>
              </span>
            )}

            {match.status === 'live' && (
              <Badge>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1 inline-block"></span>
                <span className="text-red-400 font-bold">LIVE</span> {match.time}
              </Badge>
            )}
            {match.status === 'upcoming' && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                <span>UPCOMING</span>
              </span>
            )}
            {match.status === 'finished' && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-neutral-700 text-neutral-200 uppercase">
                FINISHED
              </span>
            )}
            <div className="font-mono text-lg text-white font-bold bg-black/40 px-2.5 py-0.5 rounded border border-white/10">
              {match.currentScore}
            </div>
          </div>
        </div>

        {/* Unbeaten Streak Banner & Google Deep Research Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/70 rounded-lg px-3 py-1.5 border border-white/5 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-medium">Form &amp; Lineup Intel:</span>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
              <span className="text-amber-400 font-semibold">{match.homeTeam.name}: {homeStreak}</span>
              <span className="text-neutral-500">vs</span>
              <span className="text-blue-400 font-semibold">{match.awayTeam.name}: {awayStreak}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`"${match.homeTeam.name}" vs "${match.awayTeam.name}" lineup injuries`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition-colors flex items-center gap-1"
              title="Search this fixture on Google.com"
            >
              <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
              <span>Google.com</span>
            </a>

            <button
              onClick={() => setActiveView('intel')}
              className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Inspect verified lineups, injuries & Google Search citations"
            >
              <Globe className="w-3 h-3 text-blue-400" />
              <span>Google Deep Intel &amp; Injuries</span>
            </button>
          </div>
        </div>

        {/* Value Bet Alert Banner */}
        {prediction.valueBet?.hasValue && (
          <div
            onClick={() => setActiveView('value')}
            className="cursor-pointer bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-neutral-900/40 border border-amber-500/40 hover:border-amber-400 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-md transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
              <div>
                <span className="text-xs font-black text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
                  <span>💎 VALUE BET DETECTED:</span>
                  <span className="text-white underline">{prediction.valueBet.selection}</span>
                </span>
                <p className="text-[11px] text-neutral-300 font-mono mt-0.5">
                  Market: {prediction.valueBet.market} &bull; Edge: <strong className="text-emerald-400">+{prediction.valueBet.edgePercentage}% EV</strong> &bull; Sizing: {prediction.valueBet.recommendedStakeUnits}u
                </p>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px] font-mono border border-amber-500/30 whitespace-nowrap">
              Grade {prediction.valueBet.confidenceGrade} ↗
            </span>
          </div>
        )}
      </div>

      {/* Separate Market Navigation Tabs */}
      <div className="px-4 pt-3 border-b border-white/10 flex items-center justify-between bg-neutral-900/30 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('1x2')}
            className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeView === '1x2'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>1X2 Full-Time</span>
            {f1x2 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Pick: {f1x2.prediction}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('dnb')}
            className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeView === 'dnb'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Draw No Bet (DNB)</span>
            {dnb && dnb.pick !== 'NO_PICK' && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Pick: {dnb.pick === '1' ? '1 (Home)' : '2 (Away)'}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('halftime')}
            className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeView === 'halftime'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>HT Under 1.5 Goals</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-mono">
              HT Market
            </span>
          </button>

          {prediction.valueBet?.hasValue && (
            <button
              onClick={() => setActiveView('value')}
              className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeView === 'value'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-amber-400 hover:text-amber-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Value Bet (+EV)</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                +{prediction.valueBet.edgePercentage}%
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveView('intel')}
            className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeView === 'intel'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Deep Research</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded bg-blue-500/20 text-blue-300 font-mono flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-blue-300 inline" />
              Injuries &amp; Lineups
            </span>
          </button>
        </div>

        {/* Dynamic Result Badge */}
        <div className="pb-2">
          {activeView === '1x2' ? (
            <ResultStatusBadge status={f1x2?.predictionResult} marketLabel="FT 1X2" marketType="1x2" />
          ) : activeView === 'dnb' ? (
            <ResultStatusBadge status={dnb?.predictionResult} marketLabel="DNB" marketType="dnb" />
          ) : activeView === 'halftime' ? (
            <ResultStatusBadge status={prediction.htPredictionResult} marketLabel="HT U1.5" marketType="halftime" />
          ) : activeView === 'value' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" /> +{prediction.valueBet?.edgePercentage}% Edge
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Globe className="w-3 h-3 text-blue-400" /> Google Search Live
            </span>
          )}
        </div>
      </div>

      {/* Tab 1: 1X2 Full-Time Section */}
      {activeView === '1x2' && f1x2 && (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-neutral-300">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                1X2 Full-Time Probabilities
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                Predicted FT: <strong className="text-white">{f1x2.predictedFtScore}</strong>
                {f1x2.verifiedFtScore && (
                  <span className="ml-2 text-emerald-400 font-bold">
                    [Verified FT: {f1x2.verifiedFtScore}]
                  </span>
                )}
              </span>
            </div>

            {/* 3-Way Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Home Win (1) */}
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  f1x2.prediction === '1'
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-white/5 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-base text-white">1</span>
                  <span className="text-xs text-neutral-400 truncate max-w-[80px] hidden sm:inline">Home Win</span>
                </div>
                <div className="font-mono text-lg font-bold text-emerald-400 mt-1">
                  {(f1x2.probabilities.homeWin * 100).toFixed(0)}%
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.round(f1x2.probabilities.homeWin * 100)}%` }}
                  ></div>
                </div>
                {f1x2.prediction === '1' && (
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase text-emerald-300">
                    AI Pick ★
                  </span>
                )}
              </div>

              {/* Draw (X) */}
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  f1x2.prediction === 'X'
                    ? 'bg-amber-950/40 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-white/5 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-base text-white">X</span>
                  <span className="text-xs text-neutral-400 hidden sm:inline">Draw</span>
                </div>
                <div className="font-mono text-lg font-bold text-amber-400 mt-1">
                  {(f1x2.probabilities.draw * 100).toFixed(0)}%
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.round(f1x2.probabilities.draw * 100)}%` }}
                  ></div>
                </div>
                {f1x2.prediction === 'X' && (
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase text-amber-300">
                    AI Pick ★
                  </span>
                )}
              </div>

              {/* Away Win (2) */}
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  f1x2.prediction === '2'
                    ? 'bg-blue-950/40 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-white/5 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-base text-white">2</span>
                  <span className="text-xs text-neutral-400 truncate max-w-[80px] hidden sm:inline">Away Win</span>
                </div>
                <div className="font-mono text-lg font-bold text-blue-400 mt-1">
                  {(f1x2.probabilities.awayWin * 100).toFixed(0)}%
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.round(f1x2.probabilities.awayWin * 100)}%` }}
                  ></div>
                </div>
                {f1x2.prediction === '2' && (
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase text-blue-300">
                    AI Pick ★
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FT Verification Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-900/60 p-3.5 rounded-lg border border-white/5">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">FT Pick Verdict</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {f1x2.prediction}
                </span>
                <span className="truncate">{f1x2.label}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Double Chance Safety</div>
              <div className="text-sm font-semibold text-neutral-200">{f1x2.doubleChance}</div>
              <div className="text-xs text-amber-400 font-mono">
                {(f1x2.doubleChanceProb * 100).toFixed(0)}% Prob
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                {match.status === 'finished' ? 'Verified Full-Time Result' : 'Predicted FT Score'}
              </div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {match.verifiedScores
                  ? `${match.verifiedScores.fullTimeHome}-${match.verifiedScores.fullTimeAway}`
                  : f1x2.predictedFtScore}
              </div>
              <div className="text-xs text-neutral-400">
                {match.resultSource || 'Pre-match algorithm'}
              </div>
            </div>
          </div>

          {f1x2.analysis && (
            <div className="text-xs text-neutral-300 bg-white/5 p-3 rounded-lg border border-white/5 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{f1x2.analysis}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Draw No Bet (DNB) Section */}
      {activeView === 'dnb' && dnb && (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-neutral-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Draw No Bet (DNB) 2-Way Probability
              </span>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Draw = Stake Refunded (VOID)
              </span>
            </div>

            {/* 2-Way DNB Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Home DNB */}
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  dnb.pick === '1'
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-white/5 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-bold text-base text-white">1</span>
                  <span className="text-xs font-semibold text-neutral-300 truncate">{match.homeTeam.name} (DNB)</span>
                </div>
                <div className="font-mono text-xl font-bold text-emerald-400 mt-1">
                  {(dnb.probabilities.homeDnb * 100).toFixed(0)}%
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.round(dnb.probabilities.homeDnb * 100)}%` }}
                  ></div>
                </div>
                {dnb.pick === '1' && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase text-emerald-300">
                    AI Qualified DNB Pick ★
                  </span>
                )}
              </div>

              {/* Away DNB */}
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  dnb.pick === '2'
                    ? 'bg-blue-950/40 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-white/5 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-bold text-base text-white">2</span>
                  <span className="text-xs font-semibold text-neutral-300 truncate">{match.awayTeam.name} (DNB)</span>
                </div>
                <div className="font-mono text-xl font-bold text-blue-400 mt-1">
                  {(dnb.probabilities.awayDnb * 100).toFixed(0)}%
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.round(dnb.probabilities.awayDnb * 100)}%` }}
                  ></div>
                </div>
                {dnb.pick === '2' && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase text-blue-300">
                    AI Qualified DNB Pick ★
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DNB Verification & Rules Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-900/60 p-3.5 rounded-lg border border-white/5">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">DNB Selected Pick</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {dnb.pick === '1' ? '1 DNB' : dnb.pick === '2' ? '2 DNB' : 'NO PICK'}
                </span>
                <span className="truncate">{dnb.label}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Model Confidence</div>
              <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <span>{dnb.confidence.toFixed(1)}%</span>
                {dnb.oddsEstimate && (
                  <span className="text-xs text-neutral-400 font-normal">(@{dnb.oddsEstimate} Fair Odds)</span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400">Draw risk eliminated via push refund</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                {match.status === 'finished' ? 'Verified DNB Resolution' : 'Market Status'}
              </div>
              <div className="text-sm font-bold">
                {match.status === 'finished' ? (
                  dnb.predictionResult === 'won' ? (
                    <span className="text-emerald-400">✓ WIN (Full Return)</span>
                  ) : dnb.predictionResult === 'void' ? (
                    <span className="text-amber-400">↺ VOID (Stake Refunded)</span>
                  ) : (
                    <span className="text-red-400">✗ LOSS</span>
                  )
                ) : (
                  <span className="text-neutral-400">Pending Match Completion</span>
                )}
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                {match.verifiedScores ? `FT Score: ${match.verifiedScores.fullTimeHome}-${match.verifiedScores.fullTimeAway}` : 'In-Play / Upcoming'}
              </div>
            </div>
          </div>

          {/* DNB Transparent Rules Explainer */}
          <div className="text-xs text-neutral-300 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-300">How Draw No Bet (DNB) Settlement Works:</p>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                • <strong className="text-white">{dnb.team} wins</strong>: Prediction is graded as <strong className="text-emerald-400">WON</strong>.
                <br />
                • <strong className="text-white">Match ends in Draw</strong>: Result is <strong className="text-amber-400">VOID / Push</strong> (Stake is 100% refunded; excluded from accuracy denominator).
                <br />
                • <strong className="text-white">{dnb.team} loses</strong>: Prediction is graded as <strong className="text-red-400">LOST</strong>.
              </p>
            </div>
          </div>

          {dnb.analysis && (
            <div className="text-xs text-neutral-300 bg-white/5 p-3 rounded-lg border border-white/5 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{dnb.analysis}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Halftime & Goal Markets Section */}
      {activeView === 'halftime' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Halftime Prediction */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center bg-white/5 p-4 rounded-lg border border-white/5">
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Halftime Market</div>
              <div className="text-xl font-bold text-white my-1">{prediction.outcome}</div>
              <div className="text-neutral-400 text-xs mb-3">{prediction.market}</div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Model Confidence</div>
              <div className={`text-3xl font-mono font-bold mt-1 ${confidenceColor}`}>
                {confidence?.toFixed(1)}%
              </div>
            </div>

            {/* HT Verified Score & Goal Breakdown */}
            <div className="md:col-span-2 space-y-3 bg-neutral-900/60 p-4 rounded-lg border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">
                  Authoritative Half-Time Score
                </span>
                {match.status === 'finished' && (
                  <span className="text-xs font-mono text-emerald-400">
                    HT Score Verified Independent of FT
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/10">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase">Half-Time Score</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {match.verifiedScores
                      ? `${match.verifiedScores.halfTimeHome ?? 0}-${match.verifiedScores.halfTimeAway ?? 0}`
                      : '0-0 (In-Play/Upcoming)'}
                  </div>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <div className="text-[10px] text-neutral-400 uppercase">Total HT Goals</div>
                  <div className="text-2xl font-mono font-bold text-amber-400">
                    {match.verifiedScores
                      ? (match.verifiedScores.halfTimeHome ?? 0) + (match.verifiedScores.halfTimeAway ?? 0)
                      : 0}
                  </div>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <div className="text-[10px] text-neutral-400 uppercase">HT Evaluation Rule</div>
                  <div className="text-xs text-neutral-300 mt-1">
                    &lt; 2 goals = <strong className="text-emerald-400">WON</strong> | &ge; 2 goals = <strong className="text-red-400">LOST</strong>
                  </div>
                </div>
              </div>

              {prediction.correct_score_top3 && prediction.correct_score_top3.length > 0 && (
                <div>
                  <h4 className="text-xs text-neutral-400 uppercase tracking-wider mb-1.5 font-semibold">
                    Top 3 Halftime Correct Scorelines
                  </h4>
                  <div className="flex gap-2">
                    {prediction.correct_score_top3.map((cs, idx) => (
                      <div key={`${cs.score}-${idx}`} className="flex-1 text-center bg-white/5 p-2 rounded-md border border-white/5">
                        <div className="font-mono text-sm font-bold text-white">{cs.score}</div>
                        <div className="text-xs text-amber-400 font-mono">{(cs.probability * 100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Value Bet (+EV) Section */}
      {activeView === 'value' && prediction.valueBet && (
        <div className="p-4 space-y-4 bg-gradient-to-b from-amber-500/5 to-transparent">
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/40 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quantitative Edge Screener</span>
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {prediction.valueBet.selection}
                </h3>
                <span className="text-xs text-neutral-400">
                  Target Market: <strong className="text-neutral-200">{prediction.valueBet.market}</strong>
                </span>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1">
                  <span>+{prediction.valueBet.edgePercentage}% Expected Edge</span>
                </span>
                <div className="text-[11px] font-mono text-neutral-400 mt-1">
                  Confidence: <span className="text-amber-400 font-bold">Grade {prediction.valueBet.confidenceGrade}</span>
                </div>
              </div>
            </div>

            {/* Matrix of Odds & Model Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="block text-[10px] uppercase font-mono text-neutral-400">Model Probability</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {(prediction.valueBet.modelProbability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="block text-[10px] uppercase font-mono text-neutral-400">Calculated Fair Odds</span>
                <span className="text-base font-mono font-bold text-neutral-200">
                  {prediction.valueBet.fairOdds.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="block text-[10px] uppercase font-mono text-neutral-400">Market Estimate</span>
                <span className="text-base font-mono font-bold text-amber-300">
                  {prediction.valueBet.marketOdds.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/30">
                <span className="block text-[10px] uppercase font-mono text-neutral-400">Recommended Stake</span>
                <span className="text-base font-mono font-bold text-emerald-300">
                  {prediction.valueBet.recommendedStakeUnits} Units
                </span>
              </div>
            </div>

            {/* Analysis Rationale */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 leading-relaxed space-y-1.5">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Dixon-Coles Positive Expected Value (+EV) Thesis:</span>
              </p>
              <p>{prediction.valueBet.reasoning}</p>
              <p className="text-[11px] text-neutral-400 font-mono pt-1">
                Math: Expected Value EV = (P &times; Odds) - 1 = +{(prediction.valueBet.expectedValue * 100).toFixed(1)}%.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Real-Time Google Search Grounding Intel (SofaScore & FlashScore) */}
      {activeView === 'intel' && (
        <div className="p-4">
          <SearchGroundingIntel match={match} />
        </div>
      )}

      {/* Live In-Play Stats Bar */}
      {match.status === 'live' && (
        <div className="border-t border-white/10 p-3 flex justify-between items-center bg-white/5">
          <Stat
            label="Momentum Index"
            value={typeof match.momentumIndex === 'number' ? match.momentumIndex.toFixed(1) : 'N/A'}
          />
          <Stat label="Shots on Target" value={match.combinedShotsOnTarget} />
          <Stat label="Dangerous Attacks" value={match.dangerousAttacks} />
        </div>
      )}

      {/* Footer */}
      <div className="p-3 bg-neutral-900/80 border-t border-white/10 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-2">
        <p className="italic">
          <span className="font-semibold text-neutral-300">Verification Source:</span> {match.resultSource || 'Direct API Sync'} (v{match.resultVersion || 1})
        </p>
        <p className="text-neutral-500 text-[11px] font-mono">
          Last Verified: {match.lastVerifiedAt ? new Date(match.lastVerifiedAt).toLocaleTimeString() : 'Current'}
        </p>
      </div>
    </motion.div>
  );
}
