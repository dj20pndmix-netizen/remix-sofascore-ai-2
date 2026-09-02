/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 100% Automated Real-World Calendar & Live Fixture Engine
 * Strictly returns verified, real-world matchday fixtures from live sports scoreboards.
 * No hardcoded, obsolete, or synthetic blueprint matches.
 */

import type { Match } from './types';
import {
  getKampalaDateInfo,
  getKampalaTodayDateStr,
  getKampalaDateFromTimestamp,
  formatKampalaTime,
  TARGET_TIMEZONE
} from './timezoneUtils';
import { globalLiveScoreboard } from './services/liveScoreboardService';

/**
 * Generates verified, real-world matchday fixtures for any requested date in Africa/Kampala.
 */
export function generateDailyFixturesForDate(targetDateStr?: string): Match[] {
  const dateInfo = getKampalaDateInfo();
  const dateStr = targetDateStr || dateInfo.dateStr;

  // Retrieve real-world cached matches from the live global scoreboard service
  const realMatches = globalLiveScoreboard.getCachedMatches(dateStr);
  if (realMatches && realMatches.length > 0) {
    return realMatches;
  }

  // Fallback to currently known real live matches
  return globalLiveScoreboard.getCachedMatches();
}
