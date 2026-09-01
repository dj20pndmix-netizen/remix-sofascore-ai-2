/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistent AI Analysis Snapshot Store & Post-Match Result Tracker
 * Saves immutable analysis run snapshots in data/ai_analysis_snapshots.json
 * Tracks pre-match locks, performance records, and automatically reconciles outcomes.
 */

import fs from 'fs';
import path from 'path';
import type { AnalysisSnapshot, QualifiedPick, Match } from '../types';

const DATA_DIR = process.env.VERCEL
  ? '/tmp'
  : path.join(process.cwd(), 'data');
const SNAPSHOTS_FILE_PATH = path.join(DATA_DIR, 'ai_analysis_snapshots.json');

export class AiSnapshotStore {
  private snapshots: Map<string, AnalysisSnapshot> = new Map();
  private isLoaded: boolean = false;

  constructor() {
    this.ensureDataDirectory();
    this.loadFromDisk();
  }

  private ensureDataDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[AiSnapshotStore] Could not create data directory:', err);
    }
  }

  private loadFromDisk() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(SNAPSHOTS_FILE_PATH)) {
        const raw = fs.readFileSync(SNAPSHOTS_FILE_PATH, 'utf-8');
        const list: AnalysisSnapshot[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((snap) => {
            this.snapshots.set(snap.analysisId, snap);
          });
        }
      }
    } catch (err) {
      console.warn('[AiSnapshotStore] Error reading snapshots from disk:', err);
    }
    this.isLoaded = true;
  }

  private saveToDisk() {
    try {
      this.ensureDataDirectory();
      const list = Array.from(this.snapshots.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      fs.writeFileSync(SNAPSHOTS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[AiSnapshotStore] Error writing snapshots to disk:', err);
    }
  }

  /**
   * Save an immutable snapshot of an AI analysis job
   */
  public saveSnapshot(snapshot: AnalysisSnapshot) {
    this.loadFromDisk();
    this.snapshots.set(snapshot.analysisId, snapshot);
    this.saveToDisk();
  }

  /**
   * Retrieve the most recent completed analysis snapshot
   */
  public getLatestSnapshot(): AnalysisSnapshot | null {
    this.loadFromDisk();
    const list = Array.from(this.snapshots.values())
      .filter((s) => s.status === 'COMPLETED')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return list[0] || null;
  }

  /**
   * Retrieve a specific analysis snapshot by ID
   */
  public getSnapshotById(id: string): AnalysisSnapshot | null {
    this.loadFromDisk();
    return this.snapshots.get(id) || null;
  }

  /**
   * Retrieve all saved analysis snapshots
   */
  public getAllSnapshots(): AnalysisSnapshot[] {
    this.loadFromDisk();
    return Array.from(this.snapshots.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Reconciles all pending picks in snapshots when match scores finish
   */
  public reconcileWithFinishedMatches(finishedMatches: Match[]): number {
    this.loadFromDisk();
    const finishedMap = new Map<number, Match>();
    finishedMatches.forEach(m => {
      if (m.status === 'finished') {
        finishedMap.set(m.id, m);
      }
    });

    if (finishedMap.size === 0) return 0;

    let updatedPicksCount = 0;

    for (const snapshot of this.snapshots.values()) {
      let snapshotModified = false;

      for (const pick of snapshot.topPicks) {
        const finishedMatch = finishedMap.get(pick.matchId);
        if (!finishedMatch) continue;

        const scores = (finishedMatch.currentScore || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);
        const homeScore = scores[0];
        const awayScore = scores[1];
        const totalGoals = homeScore + awayScore;

        let outcome: 'WON' | 'LOST' | 'VOID' = 'LOST';

        switch (pick.marketType) {
          case '1X2':
            if (pick.pick.includes('Home') && homeScore > awayScore) outcome = 'WON';
            else if (pick.pick.includes('Draw') && homeScore === awayScore) outcome = 'WON';
            else if (pick.pick.includes('Away') && awayScore > homeScore) outcome = 'WON';
            else outcome = 'LOST';
            break;

          case 'DNB':
            if (homeScore === awayScore) outcome = 'VOID';
            else if (pick.pick.includes(pick.homeTeam.name) && homeScore > awayScore) outcome = 'WON';
            else if (pick.pick.includes(pick.awayTeam.name) && awayScore > homeScore) outcome = 'WON';
            else outcome = 'LOST';
            break;

          case 'DOUBLE_CHANCE':
            if (pick.pick.includes('1X') && homeScore >= awayScore) outcome = 'WON';
            else if (pick.pick.includes('X2') && awayScore >= homeScore) outcome = 'WON';
            else if (pick.pick.includes('12') && homeScore !== awayScore) outcome = 'WON';
            else outcome = 'LOST';
            break;

          case 'OVER_UNDER_GOALS':
            if (pick.pick.includes('Over 1.5') && totalGoals > 1.5) outcome = 'WON';
            else if (pick.pick.includes('Under 1.5') && totalGoals < 1.5) outcome = 'WON';
            else if (pick.pick.includes('Over 2.5') && totalGoals > 2.5) outcome = 'WON';
            else if (pick.pick.includes('Under 2.5') && totalGoals < 2.5) outcome = 'WON';
            else if (pick.pick.includes('Under 3.5') && totalGoals < 3.5) outcome = 'WON';
            else outcome = 'LOST';
            break;

          case 'BTTS':
            if (pick.pick.includes('Yes') && homeScore > 0 && awayScore > 0) outcome = 'WON';
            else if (pick.pick.includes('No') && (homeScore === 0 || awayScore === 0)) outcome = 'WON';
            else outcome = 'LOST';
            break;

          default:
            outcome = 'LOST';
        }

        if (!pick.reconciliation || pick.reconciliation.outcome !== outcome) {
          pick.reconciliation = {
            actualResult: `${homeScore}-${awayScore}`,
            outcome,
            settledScore: `${homeScore}-${awayScore}`,
            settledAt: new Date().toISOString()
          };
          snapshotModified = true;
          updatedPicksCount++;
        }
      }

      if (snapshotModified) {
        this.snapshots.set(snapshot.analysisId, snapshot);
      }
    }

    if (updatedPicksCount > 0) {
      this.saveToDisk();
    }

    return updatedPicksCount;
  }
}

// Global Singleton Instance
export const globalAiSnapshotStore = new AiSnapshotStore();
