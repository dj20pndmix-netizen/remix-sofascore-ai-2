/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import type { Match, GroundedMatchIntel } from '../types';
import { TacticalPitch } from './TacticalPitch';
import {
  Globe,
  ExternalLink,
  ShieldAlert,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Thermometer,
  Info,
  CheckCircle,
  AlertTriangle,
  UserX,
  Layers,
  Award
} from 'lucide-react';

interface Props {
  match: Match;
  onUpdateIntel?: (updatedIntel: GroundedMatchIntel) => void;
}

/**
 * Safe URI resolver that intercepts fragile deep-links from Flashscore/SofaScore
 * that fail with 404 or "The requested page can't be displayed" errors.
 */
function getSafeSourceUri(src: { uri: string; domain?: string; title?: string }, homeTeam: string, awayTeam: string): string {
  if (!src.uri) {
    return `https://www.google.com/search?q=${encodeURIComponent(`"${homeTeam}" vs "${awayTeam}" lineups news`)}`;
  }

  if (src.uri.includes('flashscore')) {
    // If it has internal alpha-numeric hashes or match subpaths that cause 404 errors on Flashscore
    if (src.uri.includes('/match/') || src.uri.includes('?mid=') || src.uri.includes('/summary/') || src.uri.includes('/lineups/')) {
      return `https://www.google.com/search?q=${encodeURIComponent(`site:flashscore.com "${homeTeam}" "${awayTeam}" lineups preview`)}`;
    }
  }

  if (src.uri.includes('sofascore')) {
    if (src.uri.includes('/match/') || /\/\d{4,}\b/.test(src.uri)) {
      return `https://www.google.com/search?q=${encodeURIComponent(`site:sofascore.com "${homeTeam}" "${awayTeam}"`)}`;
    }
  }

  return src.uri;
}

export function SearchGroundingIntel({ match, onUpdateIntel }: Props) {
  const [intel, setIntel] = useState<GroundedMatchIntel | null>(match.groundedIntel || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'lineups' | 'pitch' | 'injuries' | 'tactics' | 'sources'>('lineups');

  // Auto-fetch or populate intel if not present
  useEffect(() => {
    if (match.groundedIntel) {
      setIntel(match.groundedIntel);
    } else {
      fetchIntel(false);
    }
  }, [match.id]);

  const fetchIntel = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/verify-match-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          competition: match.competition,
          dateStr: match.kampalaDate,
          forceRefresh,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: GroundedMatchIntel = await res.json();
      setIntel(data);
      if (onUpdateIntel) {
        onUpdateIntel(data);
      }
    } catch (err: any) {
      console.error('Error loading search grounding intel:', err);
      setError(err?.message || 'Failed to retrieve Google Search grounding data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-xs text-neutral-200">
      {/* Top Banner: Google Search Grounding Verification Status */}
      <div className="bg-gradient-to-r from-blue-950/50 via-neutral-900/90 to-emerald-950/50 p-4 rounded-xl border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-sm tracking-tight">Google Live Deep Research &amp; Grounding</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Google.com &amp; SofaScore Live Sync</span>
              </span>
              {intel?.deepAudit?.injurySeverityScore !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border flex items-center gap-1 ${
                  intel.deepAudit.injurySeverityScore > 40
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  <ShieldAlert className="w-3 h-3" />
                  <span>Injury Impact: {intel.deepAudit.injurySeverityScore}%</span>
                </span>
              )}
            </div>
            <p className="text-neutral-400 text-xs mt-0.5">
              Deep research across Google Search, Transfermarkt, SofaScore, and Flashscore for live injury bulletins and tactical lineups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Google.com Search Link */}
          <a
            href={
              intel?.deepAudit?.googleSearchQueryUrl ||
              `https://www.google.com/search?q=${encodeURIComponent(`"${match.homeTeam.name}" vs "${match.awayTeam.name}" lineup injuries live`)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            title="Open live Google Search query in a new tab"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Search on Google.com ↗</span>
          </a>

          <button
            onClick={() => fetchIntel(true)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Perform fresh live Google search query"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Researching Google...' : 'Re-run Deep Research'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !intel && (
        <div className="p-8 text-center bg-white/5 rounded-xl border border-white/5 space-y-3 animate-pulse">
          <Search className="w-6 h-6 text-blue-400 mx-auto animate-bounce" />
          <p className="font-semibold text-white">Querying Google Search Grounding Feeds...</p>
          <p className="text-neutral-400 text-xs max-w-md mx-auto">
            Cross-referencing {match.homeTeam.name} vs {match.awayTeam.name} lineups and injury reports across SofaScore, Flashscore, and team news channels.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !intel && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchIntel(true)}
            className="px-2.5 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 rounded text-xs text-white"
          >
            Retry
          </button>
        </div>
      )}

      {intel && (
        <div className="space-y-3">
          {/* Scheduling & Date Verification Notice */}
          {intel.isScheduledForTargetDate === false && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Schedule Boundary Alert: </span>
                <span>{intel.schedulingNote || `These clubs are not scheduled to play each other on today's date. Actual scheduled date: ${intel.actualScheduledDate || 'Future matchday'}.`}</span>
              </div>
            </div>
          )}

          {/* Metadata Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-900/80 p-2.5 rounded-lg border border-white/5 text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{intel.venue || 'Match Stadium'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{intel.officialKickoff || match.scheduledStartTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{intel.weatherConditions || 'Pitch Good'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Ref: {intel.referee || 'Designated'}</span>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('lineups')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'lineups'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad Lineups (XI &amp; Bench)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('pitch')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'pitch'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Tactical Pitch Formations</span>
            </button>

            <button
              onClick={() => setActiveSubTab('injuries')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'injuries'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Injuries &amp; Suspensions ({intel.homeAbsences.length + intel.awayAbsences.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('tactics')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'tactics'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tactical Analysis</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sources')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'sources'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Verified Sources ({intel.sources.length})</span>
            </button>
          </div>

          {/* Subtab 0: 2D Tactical Pitch */}
          {activeSubTab === 'pitch' && (
            <TacticalPitch
              homeTeam={match.homeTeam.name}
              awayTeam={match.awayTeam.name}
              homeLineup={intel.homeLineup}
              awayLineup={intel.awayLineup}
              homeLogo={match.homeTeam.logo}
              awayLogo={match.awayTeam.logo}
            />
          )}

          {/* Subtab 1: Starting Lineups & Formations */}
          {activeSubTab === 'lineups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Home Team Lineup */}
              <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{match.homeTeam.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                      {intel.homeLineup.formation || '4-3-3'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    intel.homeLineup.isConfirmed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {intel.homeLineup.isConfirmed ? '✓ Confirmed Starting XI' : 'Projected Starting XI'}
                  </span>
                </div>

                {intel.homeLineup.manager && (
                  <div className="text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">Manager:</span> {intel.homeLineup.manager}
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Starting Eleven (XI)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px]">
                    {intel.homeLineup.startingXI.map((player, idx) => (
                      <div
                        key={`home-player-${idx}`}
                        className="bg-black/40 px-2 py-1 rounded border border-white/5 text-neutral-200 truncate flex items-center gap-1.5"
                      >
                        <span className="text-emerald-400 font-bold text-[10px] shrink-0">{idx + 1}.</span>
                        <span className="truncate font-medium">{player}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {intel.homeLineup.bench && intel.homeLineup.bench.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Substitutes &amp; Bench ({intel.homeLineup.bench.length})
                    </span>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                      {intel.homeLineup.bench.map((benchPlayer, idx) => (
                        <span
                          key={`home-bench-${idx}`}
                          className="bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-neutral-300 border border-white/5 truncate max-w-full"
                        >
                          {benchPlayer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {intel.homeLineup.tacticalNotes && (
                  <div className="bg-white/5 p-2.5 rounded-lg text-[11px] text-neutral-300 border border-white/5">
                    <span className="font-semibold text-white">Tactical Shape: </span>
                    {intel.homeLineup.tacticalNotes}
                  </div>
                )}
              </div>

              {/* Away Team Lineup */}
              <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{match.awayTeam.name}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[11px] font-bold border border-blue-500/30">
                      {intel.awayLineup.formation || '4-2-3-1'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    intel.awayLineup.isConfirmed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {intel.awayLineup.isConfirmed ? '✓ Confirmed Starting XI' : 'Projected Starting XI'}
                  </span>
                </div>

                {intel.awayLineup.manager && (
                  <div className="text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">Manager:</span> {intel.awayLineup.manager}
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Starting Eleven (XI)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px]">
                    {intel.awayLineup.startingXI.map((player, idx) => (
                      <div
                        key={`away-player-${idx}`}
                        className="bg-black/40 px-2 py-1 rounded border border-white/5 text-neutral-200 truncate flex items-center gap-1.5"
                      >
                        <span className="text-blue-400 font-bold text-[10px] shrink-0">{idx + 1}.</span>
                        <span className="truncate font-medium">{player}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {intel.awayLineup.bench && intel.awayLineup.bench.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Substitutes &amp; Bench ({intel.awayLineup.bench.length})
                    </span>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                      {intel.awayLineup.bench.map((benchPlayer, idx) => (
                        <span
                          key={`away-bench-${idx}`}
                          className="bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-neutral-300 border border-white/5 truncate max-w-full"
                        >
                          {benchPlayer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {intel.awayLineup.tacticalNotes && (
                  <div className="bg-white/5 p-2.5 rounded-lg text-[11px] text-neutral-300 border border-white/5">
                    <span className="font-semibold text-white">Tactical Shape: </span>
                    {intel.awayLineup.tacticalNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 2: Injuries & Suspensions */}
          {activeSubTab === 'injuries' && (
            <div className="space-y-3">
              {/* Tactical Vulnerability Warning Banner if any key player missing */}
              {intel.deepAudit?.tacticalVulnerabilityWarning && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-red-200 text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-100">Tactical Squad Alert: </span>
                    <span>{intel.deepAudit.tacticalVulnerabilityWarning}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Home Absences */}
                <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-white">{match.homeTeam.name} Absences</span>
                    <span className="text-xs font-mono text-neutral-400 font-semibold">
                      {intel.homeAbsences.length} Missing
                    </span>
                  </div>

                  {intel.homeAbsences.length > 0 ? (
                    <div className="space-y-2">
                      {intel.homeAbsences.map((abs, idx) => (
                        <div
                          key={`home-abs-${idx}`}
                          className="bg-black/40 p-2.5 rounded-lg border border-white/5 flex items-start justify-between gap-2 hover:border-white/10 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{abs.player}</span>
                              {abs.position && (
                                <span className="text-[10px] text-neutral-400 font-mono">({abs.position})</span>
                              )}
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${abs.player} ${match.homeTeam.name} injury news`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-400 hover:text-blue-300 ml-1"
                                title={`Search Google for ${abs.player} injury update`}
                              >
                                <ExternalLink className="w-3 h-3 inline" />
                              </a>
                            </div>
                            <p className="text-[11px] text-neutral-300">{abs.reason}</p>
                            {abs.expectedReturn && (
                              <p className="text-[10px] text-amber-400 font-mono">Expected: {abs.expectedReturn}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                abs.status === 'OUT'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {abs.status}
                            </span>
                            {abs.impactLevel === 'HIGH' && (
                              <span className="text-[9px] font-semibold text-red-300">
                                Key Starter
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-neutral-400 bg-white/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <p className="text-xs font-medium text-white">Full Squad Available</p>
                      <p className="text-[11px] text-neutral-400">No major injuries or disciplinary suspensions reported.</p>
                    </div>
                  )}
                </div>

                {/* Away Absences */}
                <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-white">{match.awayTeam.name} Absences</span>
                    <span className="text-xs font-mono text-neutral-400 font-semibold">
                      {intel.awayAbsences.length} Missing
                    </span>
                  </div>

                  {intel.awayAbsences.length > 0 ? (
                    <div className="space-y-2">
                      {intel.awayAbsences.map((abs, idx) => (
                        <div
                          key={`away-abs-${idx}`}
                          className="bg-black/40 p-2.5 rounded-lg border border-white/5 flex items-start justify-between gap-2 hover:border-white/10 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{abs.player}</span>
                              {abs.position && (
                                <span className="text-[10px] text-neutral-400 font-mono">({abs.position})</span>
                              )}
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${abs.player} ${match.awayTeam.name} injury news`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-400 hover:text-blue-300 ml-1"
                                title={`Search Google for ${abs.player} injury update`}
                              >
                                <ExternalLink className="w-3 h-3 inline" />
                              </a>
                            </div>
                            <p className="text-[11px] text-neutral-300">{abs.reason}</p>
                            {abs.expectedReturn && (
                              <p className="text-[10px] text-amber-400 font-mono">Expected: {abs.expectedReturn}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                abs.status === 'OUT'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {abs.status}
                            </span>
                            {abs.impactLevel === 'HIGH' && (
                              <span className="text-[9px] font-semibold text-red-300">
                                Key Starter
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-neutral-400 bg-white/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <p className="text-xs font-medium text-white">Full Squad Available</p>
                      <p className="text-[11px] text-neutral-400">No major injuries or disciplinary suspensions reported.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Tactical Synthesis */}
          {activeSubTab === 'tactics' && (
            <div className="space-y-3">
              <div className="bg-neutral-900/70 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Google Deep Research Tactical Assessment</span>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                  {intel.groundedSummary}
                </p>

                {intel.keyTacticalInsights.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase font-bold text-neutral-400 tracking-wider">
                      Key Match Drivers &amp; Probabilities Impact
                    </span>
                    <ul className="space-y-1.5 text-xs text-neutral-300">
                      {intel.keyTacticalInsights.map((insight, idx) => (
                        <li key={`insight-${idx}`} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 4: Verified Sources & Google Search Direct Portals */}
          {activeSubTab === 'sources' && (
            <div className="bg-neutral-900/70 p-4 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>Live Grounding Sources &amp; Search Portals</span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  Verified at: {new Date(intel.verifiedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Direct Search Engines Suite */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`"${match.homeTeam.name}" vs "${match.awayTeam.name}" lineup injuries`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 text-center transition-colors group"
                >
                  <div className="font-bold text-blue-300 text-xs flex items-center justify-center gap-1">
                    <span>Google.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-[10px] text-neutral-400">Live Search Query</div>
                </a>

                <a
                  href={`https://www.sofascore.com/search?q=${encodeURIComponent(match.homeTeam.name + ' ' + match.awayTeam.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/30 text-center transition-colors group"
                >
                  <div className="font-bold text-emerald-300 text-xs flex items-center justify-center gap-1">
                    <span>SofaScore</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-[10px] text-neutral-400">Live Match Center</div>
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`site:flashscore.com "${match.homeTeam.name}" "${match.awayTeam.name}" preview lineups`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/50 border border-amber-500/30 text-center transition-colors group"
                  title="Open verified FlashScore match preview on Google"
                >
                  <div className="font-bold text-amber-300 text-xs flex items-center justify-center gap-1">
                    <span>FlashScore</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-[10px] text-neutral-400">Match Preview &amp; Lineups</div>
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`site:transfermarkt.com "${match.homeTeam.name}" injuries squad`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-center transition-colors group"
                >
                  <div className="font-bold text-purple-300 text-xs flex items-center justify-center gap-1">
                    <span>Transfermarkt</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-[10px] text-neutral-400">Injury Dossier</div>
                </a>
              </div>

              {intel.searchQueriesUsed && intel.searchQueriesUsed.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Google Grounding Queries Run:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {intel.searchQueriesUsed.map((query, idx) => (
                      <a
                        key={`query-${idx}`}
                        href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-neutral-300 hover:text-white border border-white/5 font-mono text-[10px] flex items-center gap-1 transition-colors"
                        title="Click to search this exact query on Google"
                      >
                        <span>&ldquo;{query}&rdquo;</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {intel.sources.map((src, idx) => {
                  const safeUri = getSafeSourceUri(src, match.homeTeam.name, match.awayTeam.name);
                  return (
                    <a
                      key={`src-${idx}`}
                      href={safeUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between gap-2 group"
                    >
                      <div className="truncate">
                        <div className="font-semibold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                          {src.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate">
                          {src.domain || 'google.com'}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-400 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
