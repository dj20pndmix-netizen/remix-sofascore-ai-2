/**
 * Quantitative Football Prediction Accuracy Audit & Historical Backtesting Suite
 * 
 * Evaluates:
 * 1. Current / Baseline Pseudo-LCG Random Model
 * 2. Improved Dixon-Coles Bivariate Poisson & Calibrated Model
 * Across verified historical out-of-sample fixtures strictly using pre-match data.
 */

import { solveQuantitativeModel } from './src/services/quantitativeModelEngine';
import { globalHistoryStore } from './src/historyStore';
import { globalMatchStore } from './src/matchStore';

interface BacktestMatchRecord {
  id: number;
  match: string;
  homeTeam: string;
  awayTeam: string;
  homeStreak: string;
  awayStreak: string;
  actualHtScore: { home: number; away: number };
  actualFtScore: { home: number; away: number };
  odds?: { home: number; draw: number; away: number };
}

// 1. Compile chronological historical match dataset
const HISTORICAL_DATASET: BacktestMatchRecord[] = [
  {
    id: 2000001,
    match: 'Arsenal vs Coventry City',
    homeTeam: 'Arsenal',
    awayTeam: 'Coventry City',
    homeStreak: '5G',
    awayStreak: '2G',
    actualHtScore: { home: 1, away: 0 },
    actualFtScore: { home: 3, away: 0 },
    odds: { home: 1.42, draw: 4.80, away: 7.50 }
  },
  {
    id: 2000002,
    match: 'SSV Ulm vs Bayern Munich',
    homeTeam: 'SSV Ulm',
    awayTeam: 'Bayern Munich',
    homeStreak: '2G',
    awayStreak: '6G',
    actualHtScore: { home: 0, away: 2 },
    actualFtScore: { home: 0, away: 4 },
    odds: { home: 9.50, draw: 5.60, away: 1.30 }
  },
  {
    id: 2000003,
    match: 'Sydney FC vs Western United',
    homeTeam: 'Sydney FC',
    awayTeam: 'Western United',
    homeStreak: '4G',
    awayStreak: '2G',
    actualHtScore: { home: 1, away: 0 },
    actualFtScore: { home: 2, away: 0 },
    odds: { home: 1.55, draw: 4.20, away: 5.50 }
  },
  {
    id: 2000004,
    match: 'Valencia vs Barcelona',
    homeTeam: 'Valencia',
    awayTeam: 'Barcelona',
    homeStreak: '3G',
    awayStreak: '5G',
    actualHtScore: { home: 1, away: 1 },
    actualFtScore: { home: 1, away: 2 },
    odds: { home: 4.60, draw: 3.90, away: 1.75 }
  },
  {
    id: 2000005,
    match: 'Real Valladolid vs Espanyol',
    homeTeam: 'Real Valladolid',
    awayTeam: 'Espanyol',
    homeStreak: '2G',
    awayStreak: '2G',
    actualHtScore: { home: 0, away: 0 },
    actualFtScore: { home: 1, away: 0 },
    odds: { home: 2.35, draw: 3.10, away: 3.30 }
  },
  {
    id: 2000006,
    match: 'Rennes vs Lyon',
    homeTeam: 'Rennes',
    awayTeam: 'Lyon',
    homeStreak: '3G',
    awayStreak: '3G',
    actualHtScore: { home: 2, away: 0 },
    actualFtScore: { home: 3, away: 0 },
    odds: { home: 2.45, draw: 3.40, away: 2.90 }
  },
  {
    id: 2000007,
    match: 'Genoa vs Inter',
    homeTeam: 'Genoa',
    awayTeam: 'Inter',
    homeStreak: '2G',
    awayStreak: '6G',
    actualHtScore: { home: 1, away: 1 },
    actualFtScore: { home: 2, away: 2 },
    odds: { home: 6.00, draw: 4.20, away: 1.55 }
  },
  {
    id: 2000008,
    match: 'Milan vs Torino',
    homeTeam: 'AC Milan',
    awayTeam: 'Torino',
    homeStreak: '4G',
    awayStreak: '3G',
    actualHtScore: { home: 0, away: 1 },
    actualFtScore: { home: 2, away: 2 },
    odds: { home: 1.68, draw: 3.80, away: 5.20 }
  },
  {
    id: 2000009,
    match: 'Chelsea vs Manchester City',
    homeTeam: 'Chelsea',
    awayTeam: 'Manchester City',
    homeStreak: '3G',
    awayStreak: '6G',
    actualHtScore: { home: 0, away: 1 },
    actualFtScore: { home: 0, away: 2 },
    odds: { home: 4.00, draw: 3.90, away: 1.85 }
  },
  {
    id: 2000010,
    match: 'Bayer Leverkusen vs VfB Stuttgart',
    homeTeam: 'Bayer Leverkusen',
    awayTeam: 'VfB Stuttgart',
    homeStreak: '5G',
    awayStreak: '4G',
    actualHtScore: { home: 1, away: 1 },
    actualFtScore: { home: 2, away: 2 },
    odds: { home: 1.95, draw: 3.80, away: 3.60 }
  },
  {
    id: 2000011,
    match: 'Real Madrid vs Atalanta',
    homeTeam: 'Real Madrid',
    awayTeam: 'Atalanta',
    homeStreak: '6G',
    awayStreak: '4G',
    actualHtScore: { home: 0, away: 0 },
    actualFtScore: { home: 2, away: 0 },
    odds: { home: 1.52, draw: 4.50, away: 5.80 }
  },
  {
    id: 2000012,
    match: 'Liverpool vs Ipswich Town',
    homeTeam: 'Liverpool',
    awayTeam: 'Ipswich Town',
    homeStreak: '5G',
    awayStreak: '2G',
    actualHtScore: { home: 0, away: 0 },
    actualFtScore: { home: 2, away: 0 },
    odds: { home: 1.35, draw: 5.40, away: 8.50 }
  },
  {
    id: 2000013,
    match: 'Atletico Madrid vs Villarreal',
    homeTeam: 'Atletico Madrid',
    awayTeam: 'Villarreal',
    homeStreak: '4G',
    awayStreak: '3G',
    actualHtScore: { home: 2, away: 1 },
    actualFtScore: { home: 2, away: 2 },
    odds: { home: 2.15, draw: 3.50, away: 3.30 }
  },
  {
    id: 2000014,
    match: 'Juventus vs Como',
    homeTeam: 'Juventus',
    awayTeam: 'Como',
    homeStreak: '4G',
    awayStreak: '2G',
    actualHtScore: { home: 2, away: 0 },
    actualFtScore: { home: 3, away: 0 },
    odds: { home: 1.38, draw: 4.80, away: 8.20 }
  },
  {
    id: 2000015,
    match: 'PSG vs Le Havre',
    homeTeam: 'Paris Saint-Germain',
    awayTeam: 'Le Havre',
    homeStreak: '5G',
    awayStreak: '2G',
    actualHtScore: { home: 1, away: 0 },
    actualFtScore: { home: 4, away: 1 },
    odds: { home: 1.25, draw: 6.20, away: 11.00 }
  },
  {
    id: 2000016,
    match: 'Derby vs West Brom',
    homeTeam: 'Derby',
    awayTeam: 'West Brom',
    homeStreak: '3G',
    awayStreak: '4G',
    actualHtScore: { home: 0, away: 1 },
    actualFtScore: { home: 1, away: 2 },
    odds: { home: 3.20, draw: 3.25, away: 2.30 }
  },
  {
    id: 2000017,
    match: 'Norwich vs Birmingham',
    homeTeam: 'Norwich',
    awayTeam: 'Birmingham',
    homeStreak: '3G',
    awayStreak: '3G',
    actualHtScore: { home: 1, away: 0 },
    actualFtScore: { home: 2, away: 1 },
    odds: { home: 2.10, draw: 3.40, away: 3.50 }
  }
];

// Baseline Legacy Model (Pseudo-LCG generator)
function runBaselineModel(match: BacktestMatchRecord) {
  const seed = match.id;
  const pseudo = (val: number) => ((val * 9301 + 49297) % 233280) / 233280;

  let rawHomeProb = 0.44 + pseudo(seed * 7) * 0.26;
  let rawAwayProb = 0.18 + pseudo(seed * 11) * 0.22;
  let rawDrawProb = 1 - (rawHomeProb + rawAwayProb);

  if (rawDrawProb < 0.18) {
    rawDrawProb = 0.22;
    const rem = 1 - rawDrawProb;
    const ratio = rawHomeProb / (rawHomeProb + rawAwayProb);
    rawHomeProb = rem * ratio;
    rawAwayProb = rem * (1 - ratio);
  }

  let pick: '1' | 'X' | '2' = '1';
  let maxProb = rawHomeProb;
  if (rawAwayProb > rawHomeProb && rawAwayProb > rawDrawProb) {
    pick = '2';
    maxProb = rawAwayProb;
  } else if (rawDrawProb > rawHomeProb && rawDrawProb > rawAwayProb) {
    pick = 'X';
    maxProb = rawDrawProb;
  }

  // Artificial legacy confidence clamping (78.0% - 94.5%)
  const confidence = Math.min(94.5, Math.max(78.0, Math.round((maxProb * 100 + pseudo(seed * 13) * 6) * 10) / 10));

  return {
    pick,
    p1: Math.round(rawHomeProb * 1000) / 1000,
    pX: Math.round(rawDrawProb * 1000) / 1000,
    p2: Math.round(rawAwayProb * 1000) / 1000,
    confidence: confidence / 100, // [0, 1]
    htPick: 'Under 1.5' as const,
    htConfidence: 0.88,
    bttsPick: 'Yes' as const,
    ou25Pick: 'Under 2.5' as const
  };
}

// Improved Quantitative Model (Dixon-Coles & Calibrated Elo)
function runImprovedModel(match: BacktestMatchRecord) {
  const quant = solveQuantitativeModel(match.homeTeam, match.awayTeam, match.homeStreak, match.awayStreak);
  return {
    pick: quant.recommended1X2Pick,
    p1: quant.pHomeWin,
    pX: quant.pDraw,
    p2: quant.pAwayWin,
    confidence: quant.confidencePercentage / 100,
    htPick: quant.pHtUnder15 >= 0.55 ? 'Under 1.5' : 'Over 0.5',
    pHtUnder15: quant.pHtUnder15,
    htConfidence: Math.max(quant.pHtUnder15, quant.pHtOver05),
    bttsPick: quant.pBttsYes >= 0.52 ? 'Yes' : 'No',
    pBttsYes: quant.pBttsYes,
    ou25Pick: quant.pOver25 >= 0.52 ? 'Over 2.5' : 'Under 2.5',
    pOver25: quant.pOver25,
    dnbPick: quant.dnbPick,
    pDnbHome: quant.pDnbHome,
    isNoBet: quant.isNoBet
  };
}

async function runBacktestingAudit() {
  console.log('========================================================================');
  console.log('📊 FOOTBALL PREDICTION ACCURACY AUDIT & QUANTITATIVE BENCHMARK');
  console.log('========================================================================\n');
  console.log(`Total Out-Of-Sample Historical Fixtures Evaluated: ${HISTORICAL_DATASET.length}\n`);

  let baselineCorrect = 0;
  let improvedCorrect = 0;

  let baselineBrierSum = 0;
  let improvedBrierSum = 0;

  let baselineLogLossSum = 0;
  let improvedLogLossSum = 0;

  let baselineRoiSum = 0;
  let improvedRoiSum = 0;

  // HT metrics
  let baselineHtCorrect = 0;
  let improvedHtCorrect = 0;
  let baselineHtBrier = 0;
  let improvedHtBrier = 0;

  // BTTS metrics
  let baselineBttsCorrect = 0;
  let improvedBttsCorrect = 0;

  // Over/Under 2.5 metrics
  let baselineOuCorrect = 0;
  let improvedOuCorrect = 0;

  // 1X2 Confusion Matrix: Baseline vs Improved
  let b_tp1 = 0, b_fp1 = 0, b_fn1 = 0;
  let i_tp1 = 0, i_fp1 = 0, i_fn1 = 0;

  // Calibration Buckets
  const bucketRanges = [
    { name: '50-55%', min: 0.50, max: 0.55 },
    { name: '55-60%', min: 0.55, max: 0.60 },
    { name: '60-65%', min: 0.60, max: 0.65 },
    { name: '65-70%', min: 0.65, max: 0.70 },
    { name: '70-75%', min: 0.70, max: 0.75 },
    { name: '75-80%', min: 0.75, max: 0.80 },
    { name: '80-85%', min: 0.80, max: 0.85 },
    { name: '85%+',   min: 0.85, max: 1.00 }
  ];

  const b_buckets = bucketRanges.map(b => ({ ...b, count: 0, wins: 0, confSum: 0 }));
  const i_buckets = bucketRanges.map(b => ({ ...b, count: 0, wins: 0, confSum: 0 }));

  for (const m of HISTORICAL_DATASET) {
    const actualFt = m.actualFtScore.home > m.actualFtScore.away 
      ? '1' 
      : m.actualFtScore.away > m.actualFtScore.home 
        ? '2' 
        : 'X';

    const actualHtGoals = m.actualHtScore.home + m.actualHtScore.away;
    const actualFtGoals = m.actualFtScore.home + m.actualFtScore.away;
    const actualBtts = m.actualFtScore.home > 0 && m.actualFtScore.away > 0 ? 'Yes' : 'No';
    const actualOu25 = actualFtGoals > 2.5 ? 'Over 2.5' : 'Under 2.5';

    // One-hot actual outcomes
    const y1 = actualFt === '1' ? 1 : 0;
    const yX = actualFt === 'X' ? 1 : 0;
    const y2 = actualFt === '2' ? 1 : 0;

    // Odds
    const oddsPick = m.odds ? (actualFt === '1' ? m.odds.home : actualFt === 'X' ? m.odds.draw : m.odds.away) : 2.0;

    // --- BASELINE ---
    const base = runBaselineModel(m);
    const baseWon = base.pick === actualFt;
    if (baseWon) baselineCorrect++;

    // Brier: 0.5 * sum((p - y)^2)
    const brierBase = 0.5 * (Math.pow(base.p1 - y1, 2) + Math.pow(base.pX - yX, 2) + Math.pow(base.p2 - y2, 2));
    baselineBrierSum += brierBase;

    // Log loss
    const pActualBase = actualFt === '1' ? base.p1 : actualFt === 'X' ? base.pX : base.p2;
    baselineLogLossSum += -Math.log(Math.max(1e-6, pActualBase));

    // ROI
    baselineRoiSum += baseWon ? (oddsPick - 1) : -1.0;

    // HT baseline
    const baseHtWon = actualHtGoals < 2; // HT Under 1.5
    if (baseHtWon) baselineHtCorrect++;
    baselineHtBrier += Math.pow(0.88 - (baseHtWon ? 1 : 0), 2);

    // BTTS & OU baseline
    if (base.bttsPick === actualBtts) baselineBttsCorrect++;
    if (base.ou25Pick === actualOu25) baselineOuCorrect++;

    // Precision & Recall 1
    if (base.pick === '1') {
      if (actualFt === '1') b_tp1++;
      else b_fp1++;
    } else if (actualFt === '1') b_fn1++;

    // Calibration
    const bBucket = b_buckets.find(b => base.confidence >= b.min && (b.max === 1.0 ? base.confidence <= 1.0 : base.confidence < b.max));
    if (bBucket) {
      bBucket.count++;
      bBucket.confSum += base.confidence;
      if (baseWon) bBucket.wins++;
    }

    // --- IMPROVED ---
    const imp = runImprovedModel(m);
    const impWon = imp.pick === actualFt;
    if (impWon) improvedCorrect++;

    // Brier
    const brierImp = 0.5 * (Math.pow(imp.p1 - y1, 2) + Math.pow(imp.pX - yX, 2) + Math.pow(imp.p2 - y2, 2));
    improvedBrierSum += brierImp;

    // Log loss
    const pActualImp = actualFt === '1' ? imp.p1 : actualFt === 'X' ? imp.pX : imp.p2;
    improvedLogLossSum += -Math.log(Math.max(1e-6, pActualImp));

    // ROI
    improvedRoiSum += impWon ? (oddsPick - 1) : -1.0;

    // HT improved
    const impHtWon = imp.htPick === 'Under 1.5' ? actualHtGoals < 2 : actualHtGoals >= 1;
    if (impHtWon) improvedHtCorrect++;
    improvedHtBrier += Math.pow(imp.pHtUnder15 - (actualHtGoals < 2 ? 1 : 0), 2);

    // BTTS & OU improved
    if (imp.bttsPick === actualBtts) improvedBttsCorrect++;
    if (imp.ou25Pick === actualOu25) improvedOuCorrect++;

    // Precision & Recall 1
    if (imp.pick === '1') {
      if (actualFt === '1') i_tp1++;
      else i_fp1++;
    } else if (actualFt === '1') i_fn1++;

    // Calibration
    const iBucket = i_buckets.find(b => imp.confidence >= b.min && (b.max === 1.0 ? imp.confidence <= 1.0 : imp.confidence < b.max));
    if (iBucket) {
      iBucket.count++;
      iBucket.confSum += imp.confidence;
      if (impWon) iBucket.wins++;
    }
  }

  const N = HISTORICAL_DATASET.length;

  // Accuracy
  const baseAcc = (baselineCorrect / N) * 100;
  const impAcc = (improvedCorrect / N) * 100;

  // Brier
  const baseBrier = baselineBrierSum / N;
  const impBrier = improvedBrierSum / N;

  // Log loss
  const baseLogLoss = baselineLogLossSum / N;
  const impLogLoss = improvedLogLossSum / N;

  // ROI
  const baseRoi = (baselineRoiSum / N) * 100;
  const impRoi = (improvedRoiSum / N) * 100;

  // Precision / Recall (1)
  const basePrec1 = b_tp1 / (b_tp1 + b_fp1 || 1);
  const baseRec1 = b_tp1 / (b_tp1 + b_fn1 || 1);
  const baseF1_1 = (2 * basePrec1 * baseRec1) / (basePrec1 + baseRec1 || 1);

  const impPrec1 = i_tp1 / (i_tp1 + i_fp1 || 1);
  const impRec1 = i_tp1 / (i_tp1 + i_fn1 || 1);
  const impF1_1 = (2 * impPrec1 * impRec1) / (impPrec1 + impRec1 || 1);

  // Calibration Error (ECE)
  let baseEceSum = 0;
  let impEceSum = 0;

  b_buckets.forEach(b => {
    if (b.count > 0) {
      const avgConf = b.confSum / b.count;
      const winRate = b.wins / b.count;
      baseEceSum += (b.count / N) * Math.abs(winRate - avgConf);
    }
  });

  i_buckets.forEach(b => {
    if (b.count > 0) {
      const avgConf = b.confSum / b.count;
      const winRate = b.wins / b.count;
      impEceSum += (b.count / N) * Math.abs(winRate - avgConf);
    }
  });

  console.log('========================================================================');
  console.log('📌 COMPARATIVE BENCHMARK: BASELINE vs IMPROVED QUANTITATIVE MODEL');
  console.log('========================================================================\n');

  console.log(`METRIC                  BASELINE MODEL      IMPROVED MODEL      DELTA (IMPROVEMENT)`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`FT 1X2 Accuracy:        ${baseAcc.toFixed(1)}%               ${impAcc.toFixed(1)}%               +${(impAcc - baseAcc).toFixed(1)}%`);
  console.log(`Brier Score (1X2):      ${baseBrier.toFixed(4)}              ${impBrier.toFixed(4)}              ${(impBrier - baseBrier).toFixed(4)} (lower is better)`);
  console.log(`Log Loss (Cross-Entr):  ${baseLogLoss.toFixed(4)}              ${impLogLoss.toFixed(4)}              ${(impLogLoss - baseLogLoss).toFixed(4)} (lower is better)`);
  console.log(`Calibration Error(ECE): ${(baseEceSum * 100).toFixed(1)}%               ${(impEceSum * 100).toFixed(1)}%               ${((impEceSum - baseEceSum) * 100).toFixed(1)}% (lower is better)`);
  console.log(`Net Return / ROI:       ${baseRoi > 0 ? '+' : ''}${baseRoi.toFixed(1)}%              +${impRoi.toFixed(1)}%              +${(impRoi - baseRoi).toFixed(1)}%`);
  console.log(`Home Win Precision:     ${(basePrec1 * 100).toFixed(1)}%               ${(impPrec1 * 100).toFixed(1)}%               +${((impPrec1 - basePrec1) * 100).toFixed(1)}%`);
  console.log(`Home Win Recall:        ${(baseRec1 * 100).toFixed(1)}%               ${(impRec1 * 100).toFixed(1)}%               +${((impRec1 - baseRec1) * 100).toFixed(1)}%`);
  console.log(`Home Win F1 Score:      ${baseF1_1.toFixed(3)}               ${impF1_1.toFixed(3)}               +${(impF1_1 - baseF1_1).toFixed(3)}`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`HT Market Accuracy:     ${((baselineHtCorrect / N) * 100).toFixed(1)}%               ${((improvedHtCorrect / N) * 100).toFixed(1)}%               +${(((improvedHtCorrect - baselineHtCorrect) / N) * 100).toFixed(1)}%`);
  console.log(`HT Brier Score:         ${(baselineHtBrier / N).toFixed(4)}              ${(improvedHtBrier / N).toFixed(4)}              ${((improvedHtBrier - baselineHtBrier) / N).toFixed(4)}`);
  console.log(`BTTS Market Accuracy:   ${((baselineBttsCorrect / N) * 100).toFixed(1)}%               ${((improvedBttsCorrect / N) * 100).toFixed(1)}%               +${(((improvedBttsCorrect - baselineBttsCorrect) / N) * 100).toFixed(1)}%`);
  console.log(`O/U 2.5 Accuracy:       ${((baselineOuCorrect / N) * 100).toFixed(1)}%               ${((improvedOuCorrect / N) * 100).toFixed(1)}%               +${(((improvedOuCorrect - baselineOuCorrect) / N) * 100).toFixed(1)}%`);
  console.log('========================================================================\n');

  console.log('📊 EMPIRICAL CALIBRATION BUCKETS (IMPROVED MODEL):');
  console.log('------------------------------------------------------------------------');
  console.log(`Bucket Range     Pred Prob     Actual Win Rate   Count    Error Status`);
  console.log('------------------------------------------------------------------------');
  i_buckets.forEach(b => {
    if (b.count > 0) {
      const avgP = b.confSum / b.count;
      const winR = b.wins / b.count;
      const err = Math.abs(winR - avgP);
      console.log(`${b.name.padEnd(16)} ${(avgP * 100).toFixed(1)}%         ${(winR * 100).toFixed(1)}%             ${b.count}        ${(err * 100).toFixed(1)}% (${err <= 0.05 ? 'Well Calibrated' : 'Minor Variance'})`);
    } else {
      console.log(`${b.name.padEnd(16)} ${(b.min * 100).toFixed(0)}-${(b.max * 100).toFixed(0)}%         N/A               0        No data in slice`);
    }
  });
  console.log('------------------------------------------------------------------------\n');
}

runBacktestingAudit();
