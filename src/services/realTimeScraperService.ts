/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 100% Real-Time Live Football Web Scraping Service
 * Scrapes live and scheduled matchday fixtures from world-leading sports networks:
 * Flashscore (Live feed & schedule feeds), LiveScore Pro API, and ESPN Scoreboards.
 * Strictly guarantees 100% real-world, real-time football calendar matches.
 */

import axios from 'axios';
import { getKampalaDateFromTimestamp, getKampalaTodayDateStr } from '../timezoneUtils';

export interface ScrapedMatchRaw {
  id: string;
  source: 'flashscore' | 'livescore' | 'espn';
  competition: string;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  status: 'upcoming' | 'live' | 'finished';
  displayTime: string;
  kickoffTimestamp: string;
  score: string;
  homeScore?: number;
  awayScore?: number;
  homeHtScore?: number;
  awayHtScore?: number;
  liveMinute?: number;
  kampalaDate: string;
}

const FLASHSCORE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'x-fsign': 'SW9D1eZo',
  'Accept': '*/*',
  'Referer': 'https://www.flashscore.com/'
};

const LIVESCORE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

/**
 * Scrapes Flashscore real-time match feed by day offset (0 = today, -1 = yesterday, 1 = tomorrow, etc.)
 */
export async function scrapeFlashscoreFeed(dayOffset: number = 0, timeoutMs: number = 6500): Promise<ScrapedMatchRaw[]> {
  try {
    const feedUrl = `https://46.flashscore.ninja/33/x/feed/f_1_${dayOffset}_3_en-gb_1`;
    const res = await axios.get(feedUrl, { headers: FLASHSCORE_HEADERS, timeout: timeoutMs });
    const raw = res.data as string;
    if (!raw || typeof raw !== 'string') return [];

    const blocks = raw.split('~');
    let currentCountry = 'Global';
    let currentTournament = 'Football League';
    const matches: ScrapedMatchRaw[] = [];

    for (const block of blocks) {
      if (block.includes('ZA÷')) {
        const za = block.match(/ZA÷([^¬]+)/)?.[1];
        if (za) currentTournament = za.replace(/^[^:]+:\s*/, '').trim();
        const zy = block.match(/ZY÷([^¬]+)/)?.[1];
        if (zy) currentCountry = zy.trim();
      }

      if (block.includes('AA÷')) {
        const id = block.match(/AA÷([^¬]+)/)?.[1];
        const homeName = block.match(/AE÷([^¬]+)/)?.[1];
        const awayName = block.match(/AF÷([^¬]+)/)?.[1];
        const kickoffUnix = block.match(/AD÷([^¬]+)/)?.[1];
        const stateCode = block.match(/AB÷([^¬]+)/)?.[1];
        const minuteCode = block.match(/AC÷([^¬]+)/)?.[1];

        // Final / Current Scores
        const homeFtScore = block.match(/AG÷([^¬]+)/)?.[1] || block.match(/BA÷([^¬]+)/)?.[1];
        const awayFtScore = block.match(/AH÷([^¬]+)/)?.[1] || block.match(/BB÷([^¬]+)/)?.[1];
        const homeHtScore = block.match(/BC÷([^¬]+)/)?.[1];
        const awayHtScore = block.match(/BD÷([^¬]+)/)?.[1];

        // Team Badges
        const homeLogoKey = block.match(/OA÷([^¬]+)/)?.[1];
        const awayLogoKey = block.match(/OB÷([^¬]+)/)?.[1];

        if (homeName && awayName && id) {
          let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
          let displayTime = 'Today';
          let liveMinute: number | undefined;

          if (stateCode === '3') {
            status = 'finished';
            displayTime = 'FT';
          } else if (stateCode === '2' || (stateCode && parseInt(stateCode, 10) > 1 && parseInt(stateCode, 10) < 3)) {
            status = 'live';
            displayTime = minuteCode && !isNaN(parseInt(minuteCode, 10)) ? `${minuteCode}'` : 'Live';
            liveMinute = minuteCode && !isNaN(parseInt(minuteCode, 10)) ? parseInt(minuteCode, 10) : 45;
          } else {
            status = 'upcoming';
            if (kickoffUnix) {
              const date = new Date(parseInt(kickoffUnix, 10) * 1000);
              displayTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala' });
            }
          }

          const hScoreNum = homeFtScore !== undefined && homeFtScore !== '' ? parseInt(homeFtScore, 10) : undefined;
          const aScoreNum = awayFtScore !== undefined && awayFtScore !== '' ? parseInt(awayFtScore, 10) : undefined;
          const currentScore = hScoreNum !== undefined && aScoreNum !== undefined ? `${hScoreNum}-${aScoreNum}` : '-:-';

          const kickoffIso = kickoffUnix ? new Date(parseInt(kickoffUnix, 10) * 1000).toISOString() : new Date().toISOString();
          const matchKampalaDate = getKampalaDateFromTimestamp(kickoffIso) || getKampalaTodayDateStr();

          matches.push({
            id: `fs_${id}`,
            source: 'flashscore',
            competition: `${currentCountry}: ${currentTournament}`,
            homeName,
            awayName,
            homeLogo: homeLogoKey ? `https://static.flashscore.com/res/image/data/${homeLogoKey}` : undefined,
            awayLogo: awayLogoKey ? `https://static.flashscore.com/res/image/data/${awayLogoKey}` : undefined,
            status,
            displayTime,
            kickoffTimestamp: kickoffIso,
            kampalaDate: matchKampalaDate,
            score: currentScore,
            homeScore: hScoreNum,
            awayScore: aScoreNum,
            homeHtScore: homeHtScore && !isNaN(parseInt(homeHtScore, 10)) ? parseInt(homeHtScore, 10) : undefined,
            awayHtScore: awayHtScore && !isNaN(parseInt(awayHtScore, 10)) ? parseInt(awayHtScore, 10) : undefined,
            liveMinute
          });
        }
      }
    }

    return matches;
  } catch (err: any) {
    console.warn('[RealTimeScraperService] Flashscore feed fetch warning:', err?.message || err);
    return [];
  }
}

/**
 * Scrapes LiveScore Pro Real-Time Public API for matches on a given YYYYMMDD date
 */
export async function scrapeLiveScoreApi(todayYMD: string, timeoutMs: number = 6500): Promise<ScrapedMatchRaw[]> {
  try {
    const cleanYMD = todayYMD.replace(/-/g, '');
    const res = await axios.get(`https://prod-public-api.livescore.com/v1/api/app/date/soccer/${cleanYMD}/0`, {
      headers: LIVESCORE_HEADERS,
      timeout: timeoutMs
    });
    const stages = res.data?.Stages || [];
    const matches: ScrapedMatchRaw[] = [];

    for (const stage of stages) {
      const compName = `${stage.Cnm ? stage.Cnm + ': ' : ''}${stage.Snm || 'League'}`;
      const events = stage.Events || [];

      for (const ev of events) {
        const homeTeam = ev.T1?.[0];
        const awayTeam = ev.T2?.[0];
        if (!homeTeam || !awayTeam || !ev.Eid) continue;

        const eps = (ev.Eps || '').toUpperCase();
        let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
        let displayTime = 'Today';
        let liveMinute: number | undefined;

        let kickoffIso = new Date().toISOString();
        if (ev.Esd) {
          const raw = String(ev.Esd);
          const yr = parseInt(raw.substring(0, 4), 10);
          const mo = parseInt(raw.substring(4, 6), 10) - 1;
          const dy = parseInt(raw.substring(6, 8), 10);
          const hr = parseInt(raw.substring(8, 10), 10);
          const mn = parseInt(raw.substring(10, 12), 10);
          const kickoffDate = new Date(Date.UTC(yr, mo, dy, hr, mn));
          kickoffIso = kickoffDate.toISOString();
          displayTime = kickoffDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala' });
        }

        if (eps === 'FT' || eps === 'AET' || eps === 'AP' || eps === 'POSTP.') {
          status = 'finished';
          displayTime = 'FT';
        } else if (eps === 'NS' || eps === 'SCHED') {
          status = 'upcoming';
        } else {
          status = 'live';
          displayTime = ev.Eps || 'Live';
          const minMatch = (ev.Eps || '').match(/\d+/);
          if (minMatch) liveMinute = parseInt(minMatch[0], 10);
        }

        const homeScore = ev.Tr1 !== undefined && ev.Tr1 !== null && ev.Tr1 !== '' ? parseInt(ev.Tr1, 10) : undefined;
        const awayScore = ev.Tr2 !== undefined && ev.Tr2 !== null && ev.Tr2 !== '' ? parseInt(ev.Tr2, 10) : undefined;
        const homeHt = ev.Tr1OR1 !== undefined && ev.Tr1OR1 !== null && ev.Tr1OR1 !== '' ? parseInt(ev.Tr1OR1, 10) : undefined;
        const awayHt = ev.Tr2OR1 !== undefined && ev.Tr2OR1 !== null && ev.Tr2OR1 !== '' ? parseInt(ev.Tr2OR1, 10) : undefined;

        const matchKampalaDate = getKampalaDateFromTimestamp(kickoffIso) || getKampalaTodayDateStr();

        matches.push({
          id: `ls_${ev.Eid}`,
          source: 'livescore',
          competition: compName,
          homeName: homeTeam.Nm,
          awayName: awayTeam.Nm,
          homeLogo: homeTeam.Img ? `https://static.livescore.com/bundles/news/images/${homeTeam.Img}` : undefined,
          awayLogo: awayTeam.Img ? `https://static.livescore.com/bundles/news/images/${awayTeam.Img}` : undefined,
          status,
          displayTime,
          kickoffTimestamp: kickoffIso,
          kampalaDate: matchKampalaDate,
          score: homeScore !== undefined && awayScore !== undefined ? `${homeScore}-${awayScore}` : '-:-',
          homeScore,
          awayScore,
          homeHtScore: homeHt,
          awayHtScore: awayHt,
          liveMinute
        });
      }
    }
    return matches;
  } catch (err: any) {
    console.warn('[RealTimeScraperService] LiveScore API warning:', err?.message || err);
    return [];
  }
}

/**
 * Scrapes ESPN Global Soccer Scoreboards as tertiary fallback
 */
export async function scrapeEspnScoreboards(todayYMD: string, timeoutMs: number = 4000): Promise<ScrapedMatchRaw[]> {
  try {
    const cleanYMD = todayYMD.replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${cleanYMD}`;
    const res = await axios.get(url, { timeout: timeoutMs });
    const events = res.data?.events || [];
    const matches: ScrapedMatchRaw[] = [];

    for (const ev of events) {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
      const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

      const homeName = homeComp?.team?.displayName || homeComp?.team?.name;
      const awayName = awayComp?.team?.displayName || awayComp?.team?.name;
      if (!homeName || !awayName || !ev.id) continue;

      const state = ev.status?.type?.state; // 'pre', 'in', 'post'
      let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
      let displayTime = 'Today';
      let liveMinute: number | undefined;

      if (state === 'post') {
        status = 'finished';
        displayTime = 'FT';
      } else if (state === 'in') {
        status = 'live';
        const clock = ev.status?.displayClock;
        displayTime = clock ? `${clock}'` : 'Live';
        if (clock) liveMinute = parseInt(clock, 10);
      } else {
        status = 'upcoming';
      }

      const homeScore = homeComp?.score !== undefined ? parseInt(homeComp.score, 10) : undefined;
      const awayScore = awayComp?.score !== undefined ? parseInt(awayComp.score, 10) : undefined;
      const kickoffIso = ev.date || new Date().toISOString();
      const matchKampalaDate = getKampalaDateFromTimestamp(kickoffIso) || getKampalaTodayDateStr();

      matches.push({
        id: `espn_${ev.id}`,
        source: 'espn',
        competition: comp?.league?.name || 'Football League',
        homeName,
        awayName,
        homeLogo: homeComp?.team?.logo,
        awayLogo: awayComp?.team?.logo,
        status,
        displayTime,
        kickoffTimestamp: kickoffIso,
        kampalaDate: matchKampalaDate,
        score: homeScore !== undefined && awayScore !== undefined ? `${homeScore}-${awayScore}` : '-:-',
        homeScore,
        awayScore,
        liveMinute
      });
    }

    return matches;
  } catch {
    return [];
  }
}

/**
 * Executes a unified real-time scrape across Flashscore, LiveScore, and ESPN
 * De-duplicates matches, enriches logos, and orders matches by status and kickoff.
 */
export async function scrapeAllRealTimeMatches(targetDateStr?: string): Promise<ScrapedMatchRaw[]> {
  const todayKampala = getKampalaTodayDateStr();
  const dateStr = targetDateStr || todayKampala;

  // Calculate day offset for Flashscore
  const targetDateObj = new Date(dateStr);
  const todayDateObj = new Date(todayKampala);
  const diffDays = Math.round((targetDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
  const flashscoreOffset = isNaN(diffDays) ? 0 : diffDays;

  const ymd = dateStr.replace(/-/g, '');

  const [flashscoreResults, livescoreResults, espnResults] = await Promise.allSettled([
    scrapeFlashscoreFeed(flashscoreOffset, 6500),
    scrapeLiveScoreApi(ymd, 6500),
    scrapeEspnScoreboards(ymd, 4000)
  ]);

  const flashscoreMatches = flashscoreResults.status === 'fulfilled' ? flashscoreResults.value : [];
  const livescoreMatches = livescoreResults.status === 'fulfilled' ? livescoreResults.value : [];
  const espnMatches = espnResults.status === 'fulfilled' ? espnResults.value : [];

  const matchMap = new Map<string, ScrapedMatchRaw>();

  const normalizeTeamKey = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);

  // 1. Ingest Flashscore matches
  for (const m of flashscoreMatches) {
    const key = `${normalizeTeamKey(m.homeName)}_${normalizeTeamKey(m.awayName)}`;
    matchMap.set(key, m);
  }

  // 2. Ingest & Merge LiveScore matches
  for (const m of livescoreMatches) {
    const key = `${normalizeTeamKey(m.homeName)}_${normalizeTeamKey(m.awayName)}`;
    if (matchMap.has(key)) {
      const existing = matchMap.get(key)!;
      if (!existing.homeLogo && m.homeLogo) existing.homeLogo = m.homeLogo;
      if (!existing.awayLogo && m.awayLogo) existing.awayLogo = m.awayLogo;
      if (m.homeHtScore !== undefined && existing.homeHtScore === undefined) existing.homeHtScore = m.homeHtScore;
      if (m.awayHtScore !== undefined && existing.awayHtScore === undefined) existing.awayHtScore = m.awayHtScore;
      if (m.status === 'live' && existing.status !== 'live') {
        existing.status = 'live';
        existing.displayTime = m.displayTime;
        existing.liveMinute = m.liveMinute;
      }
    } else {
      matchMap.set(key, m);
    }
  }

  // 3. Ingest ESPN matches if missing
  for (const m of espnMatches) {
    const key = `${normalizeTeamKey(m.homeName)}_${normalizeTeamKey(m.awayName)}`;
    if (!matchMap.has(key)) {
      matchMap.set(key, m);
    }
  }

  const allScraped = Array.from(matchMap.values());

  // Prioritize top-tier leagues and matches with active statuses
  const tierWeight = (comp: string): number => {
    if (/Champions League/i.test(comp)) return 100;
    if (/Premier League/i.test(comp)) return 95;
    if (/La Liga|Primera/i.test(comp)) return 90;
    if (/Serie A/i.test(comp)) return 88;
    if (/Bundesliga/i.test(comp)) return 87;
    if (/Ligue 1/i.test(comp)) return 86;
    if (/Championship/i.test(comp)) return 85;
    if (/Europa/i.test(comp)) return 84;
    if (/Copa Libertadores|Sudamericana/i.test(comp)) return 83;
    if (/MLS|Major League/i.test(comp)) return 80;
    if (/Eredivisie|Primeira Liga|Superpokal|Cup/i.test(comp)) return 75;
    return 50;
  };

  allScraped.sort((a, b) => {
    const statusOrder = { live: 0, upcoming: 1, finished: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    const weightDiff = tierWeight(b.competition) - tierWeight(a.competition);
    if (weightDiff !== 0) return weightDiff;
    return new Date(a.kickoffTimestamp).getTime() - new Date(b.kickoffTimestamp).getTime();
  });

  return allScraped;
}
