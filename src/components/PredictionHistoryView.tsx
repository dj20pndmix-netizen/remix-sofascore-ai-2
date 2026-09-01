/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PredictionHistoryView: Persistent Historical Predictions & Settlement Ledger
 * Displays full historical track record, win rate, ROI %, profit/loss breakdown,
 * and individual match prediction outcomes.
 */

import React, { useState, useEffect } from 'react';
import type { HistoricalPredictionRecord, HistoricalStatsPayload } from '../types';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  TrendingUp,
  Search,
  RefreshCw,
  Download,
  Filter,
  Flame,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PredictionHistoryView() {
  const [historyData, setHistoryData] = useState<HistoricalStatsPayload>({
    totalSettled: 0,
    totalWon: 0,
    totalLost: 0,
    totalVoid: 0,
    winRate: 0,
    netProfitUnits: 0,
    roiPercentage: 0,
    records: []
  });
  const [loading, setLoading] = useState(false);
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WON' | 'LOST' | 'VOID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Error fetching prediction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredRecords = historyData.records.filter((rec) => {
    if (filterOutcome !== 'ALL' && rec.outcome !== filterOutcome) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = rec.match.toLowerCase();
      const comp = rec.competition.toLowerCase();
      const home = rec.homeTeam.toLowerCase();
      const away = rec.awayTeam.toLowerCase();
      return match.includes(q) || comp.includes(q) || home.includes(q) || away.includes(q);
    }
    return true;
  });

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Football AI Engine — Historical Prediction Audit Ledger', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Total Settled: ${historyData.totalSettled} | Win Rate: ${historyData.winRate}% | Net Units: ${historyData.netProfitUnits > 0 ? '+' : ''}${historyData.netProfitUnits} | ROI: ${historyData.roiPercentage}%`,
      14,
      25
    );

    const sanitize = (str: string | undefined | null) => (str ? str.replace(/[^a-zA-Z0-9\s.,%:-✓✗()]/g, '') : '');

    const tableBody = filteredRecords.map((r) => [
      sanitize(r.matchDate),
      sanitize(r.match),
      sanitize(r.competition),
      sanitize(r.market),
      sanitize(r.predictedPick),
      `${sanitize(r.verifiedHtScore)} / ${sanitize(r.verifiedFtScore)}`,
      sanitize(r.outcome),
      `${r.unitReturn >= 0 ? '+' : ''}${r.unitReturn.toFixed(2)}u`
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Date', 'Match', 'Competition', 'Market', 'Predicted Pick', 'Score (HT/FT)', 'Outcome', 'Return']],
      body: tableBody,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Prediction_History_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4">
      {/* Top Title & Stats Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 p-6 rounded-2xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">Prediction History &amp; Outcome Ledger</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  PERSISTENT SQLITE
                </span>
              </div>
              <p className="text-neutral-400 text-xs mt-0.5">
                Authoritative record of all past AI match predictions, verified outcomes, win rates, and return units.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download Prediction History as PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={fetchHistory}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Ledger</span>
            </button>
          </div>
        </div>

        {/* 4 Performance Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Win Rate */}
          <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Win Rate %</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {historyData.winRate}%
            </div>
            <div className="text-[11px] text-neutral-400">
              {historyData.totalWon} Won / {historyData.totalSettled} Settled
            </div>
          </div>

          {/* Won Outcomes */}
          <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Predictions Won</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono flex items-center gap-1.5">
              <span>{historyData.totalWon}</span>
              <span className="text-xs text-emerald-400 font-sans font-bold">🏆 Hits</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Profitable settled picks
            </div>
          </div>

          {/* Lost / Void */}
          <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Missed / Void</span>
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
              <span className="text-rose-400">{historyData.totalLost}</span>
              <span className="text-neutral-500 text-sm">/</span>
              <span className="text-amber-400">{historyData.totalVoid}</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              {historyData.totalLost} Lost • {historyData.totalVoid} Void (Refunded)
            </div>
          </div>

          {/* ROI & Net Units */}
          <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Simulated ROI</span>
              {historyData.roiPercentage >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className={`text-2xl font-black font-mono ${
              historyData.netProfitUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {historyData.netProfitUnits >= 0 ? '+' : ''}{historyData.netProfitUnits}u
            </div>
            <div className="text-[11px] text-neutral-400">
              ROI: {historyData.roiPercentage >= 0 ? '+' : ''}{historyData.roiPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/70 p-3.5 rounded-xl border border-white/10">
        {/* Outcome Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5 overflow-x-auto">
          <button
            onClick={() => setFilterOutcome('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              filterOutcome === 'ALL'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Records ({historyData.records.length})
          </button>

          <button
            onClick={() => setFilterOutcome('WON')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              filterOutcome === 'WON'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Won ({historyData.totalWon})</span>
          </button>

          <button
            onClick={() => setFilterOutcome('LOST')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              filterOutcome === 'LOST'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-rose-300'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Lost ({historyData.totalLost})</span>
          </button>

          <button
            onClick={() => setFilterOutcome('VOID')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              filterOutcome === 'VOID'
                ? 'bg-amber-600 text-white'
                : 'text-neutral-400 hover:text-amber-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Void ({historyData.totalVoid})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams or league..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* History Ledger List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const isWon = record.outcome === 'WON';
            const isLost = record.outcome === 'LOST';
            const isVoid = record.outcome === 'VOID';

            return (
              <div
                key={`history-${record.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isWon
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                    : isLost
                    ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-400">
                      {record.competition}
                    </span>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {record.matchDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Outcome Badge */}
                    {isWon && (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PREDICTION WON</span>
                      </span>
                    )}
                    {isLost && (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1 shadow-sm">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>PREDICTION LOST</span>
                      </span>
                    )}
                    {isVoid && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1 shadow-sm">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>VOID (REFUNDED)</span>
                      </span>
                    )}

                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      record.unitReturn > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : record.unitReturn < 0
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-neutral-700/50 text-neutral-300 border-white/10'
                    }`}>
                      {record.unitReturn > 0 ? '+' : ''}{record.unitReturn.toFixed(2)}u
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
                  {/* Fixture & Final Score */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Match &amp; Verified Score</span>
                    <div className="font-bold text-white text-sm">
                      {record.match}
                    </div>
                    <div className="font-mono text-xs text-neutral-300 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-bold text-white">
                        FT: {record.verifiedFtScore}
                      </span>
                      <span className="text-neutral-400">HT: {record.verifiedHtScore}</span>
                    </div>
                  </div>

                  {/* Predicted Selection */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Model Selection ({record.market})</span>
                    <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <span>{record.predictedPick}</span>
                      {record.oddsEstimate && (
                        <span className="text-[11px] font-mono text-neutral-400">(@{record.oddsEstimate})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Model Confidence: <strong className="text-white">{record.confidence}%</strong>
                    </div>
                  </div>

                  {/* Verification Note */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Audit Source &amp; Settlement</span>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {record.notes || `Settled automatically against ${record.source}.`}
                    </p>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Settled at: {new Date(record.settledAt).toLocaleTimeString()} ({record.source})
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-neutral-900/40 rounded-2xl border border-white/10 space-y-3">
          <Clock className="w-8 h-8 text-neutral-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No historical predictions match your filter</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Try adjusting your search criteria or switch to &quot;All Records&quot; to inspect settled fixtures.
          </p>
        </div>
      )}
    </div>
  );
}
