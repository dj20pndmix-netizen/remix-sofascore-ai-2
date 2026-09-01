/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { Match, TestSuiteResult, TestCaseResult } from '../types';
import { globalMatchStore } from '../matchStore';
import { runAutomatedVerificationTests } from '../verificationEngine';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Edit3,
  Check,
  X,
  FileCheck,
  HelpCircle,
  Layers
} from 'lucide-react';

export function AdminVerificationPanel({ onDataUpdated }: { onDataUpdated?: () => void }) {
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      return globalMatchStore.getAllMatches();
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [testSuite, setTestSuite] = useState<TestSuiteResult | null>(() => {
    try {
      return runAutomatedVerificationTests();
    } catch {
      return null;
    }
  });
  const [runningTests, setRunningTests] = useState(false);

  // Edit / Override Modal State
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [htHome, setHtHome] = useState<number>(0);
  const [htAway, setHtAway] = useState<number>(0);
  const [ftHome, setFtHome] = useState<number>(0);
  const [ftAway, setFtAway] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadMatches() {
    try {
      const res = await fetch('/api/all-matches');
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      } else {
        setMatches(globalMatchStore.getAllMatches());
      }
    } catch (err) {
      console.warn('Loading matches locally for admin:', err);
      setMatches(globalMatchStore.getAllMatches());
    } finally {
      setLoading(false);
    }
  }

  async function runTestSuite() {
    try {
      setRunningTests(true);
      const res = await fetch('/api/verification/run-tests');
      if (res.ok) {
        const results: TestSuiteResult = await res.json();
        setTestSuite(results);
      } else {
        setTestSuite(runAutomatedVerificationTests());
      }
    } catch (err) {
      console.warn('Running tests locally:', err);
      setTestSuite(runAutomatedVerificationTests());
    } finally {
      setRunningTests(false);
    }
  }

  useEffect(() => {
    loadMatches();
    runTestSuite();
  }, []);

  function handleOpenEdit(m: Match) {
    setEditingMatch(m);
    setHtHome(m.verifiedScores?.halfTimeHome ?? 0);
    setHtAway(m.verifiedScores?.halfTimeAway ?? 0);
    setFtHome(m.verifiedScores?.fullTimeHome ?? (parseInt(m.currentScore?.split('-')[0]) || 0));
    setFtAway(m.verifiedScores?.fullTimeAway ?? (parseInt(m.currentScore?.split('-')[1]) || 0));
    setAdminNotes(`Manual audit review for match ID ${m.id}`);
    setEditError(null);
    setEditSuccess(null);
  }

  async function handleSaveVerification() {
    if (!editingMatch) return;

    // Client-side quick check
    if (ftHome < htHome || ftAway < htAway) {
      setEditError(`Impossible Score: Full-Time goals (${ftHome}-${ftAway}) cannot be less than Half-Time goals (${htHome}-${htAway}).`);
      return;
    }

    try {
      setSaving(true);
      setEditError(null);
      const res = await fetch('/api/verification/manual-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: editingMatch.id,
          htHome,
          htAway,
          ftHome,
          ftAway,
          adminNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.success) {
          setEditError(data.message || 'Verification update rejected.');
        } else {
          setEditSuccess(data.message);
          loadMatches();
          if (onDataUpdated) onDataUpdated();
          setTimeout(() => {
            setEditingMatch(null);
            setEditSuccess(null);
          }, 1200);
        }
      } else {
        const localResult = globalMatchStore.manualVerifyMatch(
          Number(editingMatch.id),
          { htHome, htAway, ftHome, ftAway },
          adminNotes
        );
        if (localResult.success) {
          setEditSuccess(localResult.message);
          loadMatches();
          if (onDataUpdated) onDataUpdated();
          setTimeout(() => {
            setEditingMatch(null);
            setEditSuccess(null);
          }, 1200);
        } else {
          setEditError(localResult.message);
        }
      }
    } catch (err) {
      const localResult = globalMatchStore.manualVerifyMatch(
        Number(editingMatch.id),
        { htHome, htAway, ftHome, ftAway },
        adminNotes
      );
      if (localResult.success) {
        setEditSuccess(localResult.message);
        loadMatches();
        if (onDataUpdated) onDataUpdated();
        setTimeout(() => {
          setEditingMatch(null);
          setEditSuccess(null);
        }, 1200);
      } else {
        setEditError(localResult.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-neutral-800/80 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Quality Control & Match Verification</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Authoritative Result Inspector & QA Hub</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit half-time & full-time score sources, resolve conflicts, and run automated edge-case assertions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runTestSuite}
            disabled={runningTests}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
            <span>{runningTests ? 'Executing Test Suite...' : 'Run Automated QA Tests'}</span>
          </button>

          <button
            onClick={loadMatches}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 rounded-lg transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Test Suite Results Section */}
      {testSuite && (
        <div className="bg-neutral-800/60 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Automated Verification Test Suite (Phase 20 & 21)</h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {testSuite.passed} / {testSuite.total} Passed
              </span>
              {testSuite.failed > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  {testSuite.failed} Failed
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {testSuite.results.map((test) => (
              <div
                key={test.id}
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  test.passed
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-neutral-200'
                    : 'bg-red-950/20 border-red-500/30 text-red-200'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-white">{test.id}</span>
                  {test.passed ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 text-[11px] font-bold">
                      <XCircle className="w-3.5 h-3.5" /> FAILED
                    </span>
                  )}
                </div>
                <div className="font-semibold text-white font-sans">{test.name}</div>
                <div className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  {test.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Records Table */}
      <div className="bg-neutral-800/60 border border-white/10 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">All Matches & Authoritative Result Status</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">{matches.length} Total Matches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/5 text-neutral-400 uppercase tracking-wider font-semibold border-b border-white/10">
                <th className="py-2.5 px-3">ID / Match</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Verified HT</th>
                <th className="py-2.5 px-3">Verified FT</th>
                <th className="py-2.5 px-3">DNB Status</th>
                <th className="py-2.5 px-3">HT Status</th>
                <th className="py-2.5 px-3">FT 1X2 Status</th>
                <th className="py-2.5 px-3">Result Source</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {matches.map((m) => {
                const p = m.prediction;
                const f1x2 = p?.fullTime1X2;
                const dnb = p?.dnb;
                const vs = m.verifiedScores;

                return (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-semibold text-white">{m.match}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        ID: {m.id} {m.providerMatchId ? `• ${m.providerMatchId}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {m.status === 'live' && (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">
                          LIVE ({m.time})
                        </span>
                      )}
                      {m.status === 'upcoming' && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                          UPCOMING ({m.time})
                        </span>
                      )}
                      {m.status === 'finished' && (
                        <span className="px-2 py-0.5 rounded bg-neutral-700 text-neutral-200 font-bold text-[10px]">
                          FINISHED
                        </span>
                      )}
                      {m.resultVerificationStatus === 'CONFLICTED' && (
                        <span className="block mt-1 text-[10px] text-red-400 font-bold">
                          ⚠️ Conflicted
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {vs ? (
                        <span className="font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                          {vs.halfTimeHome ?? 0}-{vs.halfTimeAway ?? 0}
                        </span>
                      ) : (
                        <span className="text-neutral-500">-:-</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {vs ? (
                        <span className="font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                          {vs.fullTimeHome ?? 0}-{vs.fullTimeAway ?? 0}
                        </span>
                      ) : (
                        <span className="text-neutral-500">{m.currentScore}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {dnb?.predictionResult === 'won' ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                          WON ({dnb.pick === '1' ? '1 DNB' : '2 DNB'})
                        </span>
                      ) : dnb?.predictionResult === 'void' ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                          VOID (Push)
                        </span>
                      ) : dnb?.predictionResult === 'lost' ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[11px]">
                          LOST ({dnb.pick === '1' ? '1 DNB' : '2 DNB'})
                        </span>
                      ) : dnb?.pick === 'NO_PICK' ? (
                        <span className="text-neutral-500">NO PICK</span>
                      ) : (
                        <span className="text-neutral-500">PENDING</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {p?.htPredictionResult === 'won' ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                          WON
                        </span>
                      ) : p?.htPredictionResult === 'lost' ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[11px]">
                          LOST
                        </span>
                      ) : (
                        <span className="text-neutral-500">PENDING</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {f1x2?.predictionResult === 'won' ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                          WON ({f1x2.prediction})
                        </span>
                      ) : f1x2?.predictionResult === 'lost' ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[11px]">
                          LOST ({f1x2.prediction})
                        </span>
                      ) : (
                        <span className="text-neutral-500">PENDING</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans text-neutral-400 text-[11px]">
                      <div className="truncate max-w-[140px] text-neutral-200">{m.resultSource || 'Direct API'}</div>
                      <div className="text-neutral-500 text-[10px]">v{m.resultVersion || 1}</div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 rounded text-xs font-sans transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Verify</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Verification Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-800 border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Manual Result Verification & Correction</h3>
                <p className="text-xs text-neutral-400">{editingMatch.match}</p>
              </div>
              <button
                onClick={() => setEditingMatch(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            {/* Score Inputs */}
            <div className="grid grid-cols-2 gap-4">
              {/* Halftime Scores */}
              <div className="bg-white/5 p-3.5 rounded-xl space-y-2 border border-white/5">
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Half-Time Score (HT)
                </label>
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">Home</span>
                    <input
                      type="number"
                      min="0"
                      value={htHome}
                      onChange={(e) => setHtHome(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-neutral-900 border border-white/10 rounded px-2.5 py-1.5 text-center font-mono font-bold text-white text-base"
                    />
                  </div>
                  <span className="text-neutral-500 font-bold text-lg pt-3">-</span>
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">Away</span>
                    <input
                      type="number"
                      min="0"
                      value={htAway}
                      onChange={(e) => setHtAway(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-neutral-900 border border-white/10 rounded px-2.5 py-1.5 text-center font-mono font-bold text-white text-base"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Total HT Goals: <strong className="text-white font-mono">{htHome + htAway}</strong>
                </div>
              </div>

              {/* Fulltime Scores */}
              <div className="bg-white/5 p-3.5 rounded-xl space-y-2 border border-white/5">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                  Full-Time Score (FT)
                </label>
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">Home</span>
                    <input
                      type="number"
                      min="0"
                      value={ftHome}
                      onChange={(e) => setFtHome(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-neutral-900 border border-white/10 rounded px-2.5 py-1.5 text-center font-mono font-bold text-white text-base"
                    />
                  </div>
                  <span className="text-neutral-500 font-bold text-lg pt-3">-</span>
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">Away</span>
                    <input
                      type="number"
                      min="0"
                      value={ftAway}
                      onChange={(e) => setFtAway(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-neutral-900 border border-white/10 rounded px-2.5 py-1.5 text-center font-mono font-bold text-white text-base"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Actual Result: <strong className="text-white font-mono">{ftHome > ftAway ? '1 (Home Win)' : ftHome === ftAway ? 'X (Draw)' : '2 (Away Win)'}</strong>
                </div>
              </div>
            </div>

            {/* Audit Notes */}
            <div className="space-y-1">
              <label className="text-xs text-neutral-400 font-semibold">Verification Audit Notes</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reason for verification / correction"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Validation warning if HT > FT */}
            {(ftHome < htHome || ftAway < htAway) && (
              <div className="text-[11px] text-red-400 bg-red-500/10 p-2.5 rounded border border-red-500/20">
                ⚠️ Validation Error: Full-Time score cannot have fewer goals than Half-Time score.
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVerification}
                disabled={saving || ftHome < htHome || ftAway < htAway}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Apply Verified Result'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
