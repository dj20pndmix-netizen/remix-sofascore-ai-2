import { scrapeAllRealTimeMatches, scrapeFlashscoreFeed, scrapeLiveScoreApi, scrapeEspnScoreboards } from '../src/services/realTimeScraperService';
import { getKampalaTodayDateStr } from '../src/timezoneUtils';

async function main() {
  const today = getKampalaTodayDateStr();
  console.log('Today in Kampala:', today);

  console.log('Testing Flashscore direct feed...');
  try {
    const fs = await scrapeFlashscoreFeed(0, 8000);
    console.log('Flashscore matches count:', fs.length);
    if (fs.length > 0) {
      console.log('Sample Flashscore match:', fs[0].homeName, 'vs', fs[0].awayName, fs[0].competition, fs[0].score, fs[0].status, fs[0].displayTime);
    }
  } catch (e: any) {
    console.log('Flashscore failed:', e.message);
  }

  console.log('Testing LiveScore direct feed...');
  try {
    const ymd = today.replace(/-/g, '');
    const ls = await scrapeLiveScoreApi(ymd, 8000);
    console.log('LiveScore matches count:', ls.length);
    if (ls.length > 0) {
      console.log('Sample LiveScore match:', ls[0].homeName, 'vs', ls[0].awayName, ls[0].competition, ls[0].score, ls[0].status);
    }
  } catch (e: any) {
    console.log('LiveScore failed:', e.message);
  }

  console.log('Testing ESPN feed...');
  try {
    const ymd = today.replace(/-/g, '');
    const espn = await scrapeEspnScoreboards(ymd, 8000);
    console.log('ESPN matches count:', espn.length);
    if (espn.length > 0) {
      console.log('Sample ESPN match:', espn[0].homeName, 'vs', espn[0].awayName, espn[0].competition, espn[0].score, espn[0].status);
    }
  } catch (e: any) {
    console.log('ESPN failed:', e.message);
  }

  console.log('Testing unified scrapeAllRealTimeMatches...');
  const unified = await scrapeAllRealTimeMatches(today);
  console.log('Total unified count:', unified.length);
  if (unified.length > 0) {
    console.log('Top 5 matches:');
    unified.slice(0, 5).forEach((m, idx) => {
      console.log(`${idx + 1}. [${m.source}] ${m.homeName} vs ${m.awayName} (${m.competition}) - ${m.score} [${m.status} - ${m.displayTime}]`);
    });
  }
}

main().catch(console.error);
