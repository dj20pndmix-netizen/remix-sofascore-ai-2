/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  MatchVerificationStatus,
  MarketAccuracyStats,
  DataQualityStats,
  AccuracyAuditRecord,
  AccuracyDashboardPayload,
  TestCaseResult,
  TestSuiteResult,
  VerifiedScores
} from './types';

/**
 * Validates whether HT and FT scores represent a physically possible football match score.
 */
export function validateScores(
  htHome: number | null,
  htAway: number | null,
  ftHome: number | null,
  ftAway: number | null
): { valid: boolean; reason?: string } {
  // Check for negative numbers
  if (
    (htHome !== null && htHome < 0) ||
    (htAway !== null && htAway < 0) ||
    (ftHome !== null && ftHome < 0) ||
    (ftAway !== null && ftAway < 0)
  ) {
    return { valid: false, reason: 'Scores cannot be negative' };
  }

  // If both HT and FT scores are present, FT cannot be lower than HT
  if (htHome !== null && ftHome !== null && ftHome < htHome) {
    return {
      valid: false,
      reason: `Impossible score: FT home goals (${ftHome}) cannot be less than HT home goals (${htHome})`
    };
  }

  if (htAway !== null && ftAway !== null && ftAway < htAway) {
    return {
      valid: false,
      reason: `Impossible score: FT away goals (${ftAway}) cannot be less than HT away goals (${htAway})`
    };
  }

  return { valid: true };
}

/**
 * Evaluates a FT 1X2 prediction against authoritative full-time scores.
 * 1 = Home Win (ftHome > ftAway)
 * X = Draw (ftHome == ftAway)
 * 2 = Away Win (ftHome < ftAway)
 */
export function evaluateFT1X2(
  predictionPick: '1' | 'X' | '2',
  ftHome: number | null,
  ftAway: number | null,
  verificationStatus: MatchVerificationStatus = 'VERIFIED'
): {
  status: 'won' | 'lost' | 'pending' | 'needs_review';
  actualResult: '1' | 'X' | '2' | 'PENDING' | 'INVALID';
  scoreString: string;
} {
  if (verificationStatus === 'NEEDS_REVIEW' || verificationStatus === 'CONFLICTED') {
    return {
      status: 'needs_review',
      actualResult: 'PENDING',
      scoreString: ftHome !== null && ftAway !== null ? `${ftHome}-${ftAway}` : '-:-'
    };
  }

  if (ftHome === null || ftAway === null) {
    return {
      status: 'pending',
      actualResult: 'PENDING',
      scoreString: '-:-'
    };
  }

  let actualResult: '1' | 'X' | '2';
  if (ftHome > ftAway) {
    actualResult = '1';
  } else if (ftHome === ftAway) {
    actualResult = 'X';
  } else {
    actualResult = '2';
  }

  const isWon = actualResult === predictionPick;

  return {
    status: isWon ? 'won' : 'lost',
    actualResult,
    scoreString: `${ftHome}-${ftAway}`
  };
}

/**
 * Evaluates a Halftime prediction strictly against authoritative half-time scores.
 * For "HT Under 1.5 Goals":
 *   HT_TOTAL = htHome + htAway
 *   HT_TOTAL < 2 (0 or 1 goal) => WON
 *   HT_TOTAL >= 2 (2 or more goals) => LOST
 */
export function evaluateHTMarket(
  market: string,
  outcome: string,
  htHome: number | null,
  htAway: number | null,
  verificationStatus: MatchVerificationStatus = 'VERIFIED'
): {
  status: 'won' | 'lost' | 'pending' | 'needs_review';
  htTotalGoals: number | 'N/A';
  scoreString: string;
} {
  if (verificationStatus === 'NEEDS_REVIEW' || verificationStatus === 'CONFLICTED') {
    return {
      status: 'needs_review',
      htTotalGoals: htHome !== null && htAway !== null ? htHome + htAway : 'N/A',
      scoreString: htHome !== null && htAway !== null ? `${htHome}-${htAway}` : '-:-'
    };
  }

  if (htHome === null || htAway === null) {
    return {
      status: 'pending',
      htTotalGoals: 'N/A',
      scoreString: '-:-'
    };
  }

  const htTotalGoals = htHome + htAway;
  const scoreString = `${htHome}-${htAway}`;

  // Normalized check for market types
  const lowerMarket = (market || '').toLowerCase();
  const lowerOutcome = (outcome || '').toLowerCase();

  // 1. HT Under 1.5 Goals
  if (lowerMarket.includes('under 1.5') || lowerOutcome.includes('under 1.5')) {
    const isWon = htTotalGoals < 2; // 0 or 1 goal
    return {
      status: isWon ? 'won' : 'lost',
      htTotalGoals,
      scoreString
    };
  }

  // 2. HT Over 0.5 Goals
  if (lowerMarket.includes('over 0.5') || lowerOutcome.includes('over 0.5')) {
    const isWon = htTotalGoals >= 1;
    return {
      status: isWon ? 'won' : 'lost',
      htTotalGoals,
      scoreString
    };
  }

  // 3. HT Correct Score (e.g. "0-0", "1-0", "0-1")
  if (lowerMarket.includes('correct score') || lowerOutcome.includes('-')) {
    const isWon = lowerOutcome.trim() === scoreString;
    return {
      status: isWon ? 'won' : 'lost',
      htTotalGoals,
      scoreString
    };
  }

  // Default fallback for generic Under markets (e.g. Under 0.5)
  if (lowerOutcome.includes('under 0.5')) {
    return {
      status: htTotalGoals === 0 ? 'won' : 'lost',
      htTotalGoals,
      scoreString
    };
  }

  return {
    status: htTotalGoals < 2 ? 'won' : 'lost',
    htTotalGoals,
    scoreString
  };
}

/**
 * Evaluates a Draw No Bet (DNB) prediction against authoritative full-time scores.
 * Rule:
 * 1 = Back Home (Home Win => WON, Draw => VOID, Away Win => LOST)
 * 2 = Back Away (Away Win => WON, Draw => VOID, Home Win => LOST)
 * If Draw: Outcome is ALWAYS VOID (push/refund), NEVER WIN or LOSS.
 */
export function evaluateDNB(
  predictionPick: '1' | '2' | 'NO_PICK' | undefined,
  ftHome: number | null,
  ftAway: number | null,
  verificationStatus: MatchVerificationStatus = 'VERIFIED'
): {
  status: 'won' | 'lost' | 'void' | 'pending' | 'needs_review' | 'no_pick';
  actualResult: 'WON' | 'LOST' | 'VOID' | 'PENDING' | 'INVALID' | 'NO_PICK';
  scoreString: string;
} {
  if (!predictionPick || predictionPick === 'NO_PICK') {
    return {
      status: 'no_pick',
      actualResult: 'NO_PICK',
      scoreString: ftHome !== null && ftAway !== null ? `${ftHome}-${ftAway}` : '-:-'
    };
  }

  if (verificationStatus === 'NEEDS_REVIEW' || verificationStatus === 'CONFLICTED') {
    return {
      status: 'needs_review',
      actualResult: 'PENDING',
      scoreString: ftHome !== null && ftAway !== null ? `${ftHome}-${ftAway}` : '-:-'
    };
  }

  if (ftHome === null || ftAway === null) {
    return {
      status: 'pending',
      actualResult: 'PENDING',
      scoreString: '-:-'
    };
  }

  const scoreString = `${ftHome}-${ftAway}`;

  // DRAW NO BET: If the match ends in a draw, the bet is VOID (Refunded).
  if (ftHome === ftAway) {
    return {
      status: 'void',
      actualResult: 'VOID',
      scoreString
    };
  }

  if (ftHome > ftAway) {
    // Home win
    const isWon = predictionPick === '1';
    return {
      status: isWon ? 'won' : 'lost',
      actualResult: isWon ? 'WON' : 'LOST',
      scoreString
    };
  } else {
    // Away win
    const isWon = predictionPick === '2';
    return {
      status: isWon ? 'won' : 'lost',
      actualResult: isWon ? 'WON' : 'LOST',
      scoreString
    };
  }
}

/**
 * Calculates independent FT, HT, and DNB accuracy percentages and data quality metrics.
 * NEVER merges FT, HT, and DNB into a single blended number.
 * For DNB: Voids are excluded from the denominator. Accuracy = Wins / (Wins + Losses) * 100.
 */
export function calculateAccuracyMetrics(records: AccuracyAuditRecord[]): {
  ftStats: MarketAccuracyStats;
  htStats: MarketAccuracyStats;
  dnbStats: MarketAccuracyStats;
  dataQuality: DataQualityStats;
  comparativeVerdict: {
    moreAccurateMarket: 'HT Under 1.5' | 'FT 1X2' | 'Draw No Bet (DNB)' | 'Equal Accuracy' | 'Insufficient Data';
    differencePercentage: number;
    explanation: string;
  };
} {
  let ftCorrect = 0;
  let ftIncorrect = 0;
  let htCorrect = 0;
  let htIncorrect = 0;
  let dnbCorrect = 0;
  let dnbIncorrect = 0;
  let dnbVoids = 0;

  let verifiedCount = 0;
  let pendingCount = 0;
  let conflictedCount = 0;
  let correctedCount = 0;

  for (const record of records) {
    if (record.verificationStatus === 'VERIFIED') {
      verifiedCount++;
    } else if (record.verificationStatus === 'PENDING_VERIFICATION') {
      pendingCount++;
    } else if (record.verificationStatus === 'CONFLICTED' || record.verificationStatus === 'NEEDS_REVIEW') {
      conflictedCount++;
    }

    if (record.resultVersion > 1) {
      correctedCount++;
    }

    // FT 1X2 evaluation count
    if (record.ftStatus === 'WON') {
      ftCorrect++;
    } else if (record.ftStatus === 'LOST') {
      ftIncorrect++;
    }

    // HT evaluation count
    if (record.htStatus === 'WON') {
      htCorrect++;
    } else if (record.htStatus === 'LOST') {
      htIncorrect++;
    }

    // DNB evaluation count (Excluding voids and no_pick from win/loss counts)
    if (record.dnbStatus === 'WON') {
      dnbCorrect++;
    } else if (record.dnbStatus === 'LOST') {
      dnbIncorrect++;
    } else if (record.dnbStatus === 'VOID') {
      dnbVoids++;
    }
  }

  const ftTotalVerified = ftCorrect + ftIncorrect;
  const htTotalVerified = htCorrect + htIncorrect;
  const dnbDecided = dnbCorrect + dnbIncorrect;
  const dnbTotalVerified = dnbDecided + dnbVoids;

  const ftAccuracyPercentage =
    ftTotalVerified > 0 ? Math.round((ftCorrect / ftTotalVerified) * 10000) / 100 : 0;
  const htAccuracyPercentage =
    htTotalVerified > 0 ? Math.round((htCorrect / htTotalVerified) * 10000) / 100 : 0;
  // DNB Accuracy: Voids are excluded from denominator (Wins / (Wins + Losses))
  const dnbAccuracyPercentage =
    dnbDecided > 0 ? Math.round((dnbCorrect / dnbDecided) * 10000) / 100 : 0;

  let moreAccurateMarket: 'HT Under 1.5' | 'FT 1X2' | 'Draw No Bet (DNB)' | 'Equal Accuracy' | 'Insufficient Data' =
    'Insufficient Data';
  let differencePercentage = 0;
  let explanation = 'Awaiting verified match results to evaluate predictive accuracy across markets.';

  if (ftTotalVerified >= 3 && htTotalVerified >= 3) {
    const markets = [
      { name: 'Draw No Bet (DNB)' as const, acc: dnbAccuracyPercentage, count: dnbDecided },
      { name: 'HT Under 1.5' as const, acc: htAccuracyPercentage, count: htTotalVerified },
      { name: 'FT 1X2' as const, acc: ftAccuracyPercentage, count: ftTotalVerified }
    ];

    // Sort by accuracy descending
    markets.sort((a, b) => b.acc - a.acc);
    const top = markets[0];
    const second = markets[1];

    if (top.acc === second.acc) {
      moreAccurateMarket = 'Equal Accuracy';
      explanation = `Verified match records show top performance equal at ${top.acc.toFixed(1)}% across verified fixtures.`;
    } else {
      moreAccurateMarket = top.name;
      const diff = Math.round((top.acc - second.acc) * 100) / 100;
      differencePercentage = diff;
      explanation = `Verified match records confirm ${top.name} leads with ${top.acc.toFixed(
        1
      )}% accuracy (${top.name === 'Draw No Bet (DNB)' ? `${dnbVoids} draws pushed as void, ` : ''}outperforming ${second.name} by +${diff.toFixed(1)}%).`;
    }
  }

  return {
    ftStats: {
      totalVerified: ftTotalVerified,
      correct: ftCorrect,
      incorrect: ftIncorrect,
      accuracyPercentage: ftAccuracyPercentage
    },
    htStats: {
      totalVerified: htTotalVerified,
      correct: htCorrect,
      incorrect: htIncorrect,
      accuracyPercentage: htAccuracyPercentage
    },
    dnbStats: {
      totalVerified: dnbTotalVerified,
      correct: dnbCorrect,
      incorrect: dnbIncorrect,
      voids: dnbVoids,
      accuracyPercentage: dnbAccuracyPercentage
    },
    dataQuality: {
      totalMatches: records.length,
      verified: verifiedCount,
      pending: pendingCount,
      conflicted: conflictedCount,
      corrected: correctedCount
    },
    comparativeVerdict: {
      moreAccurateMarket,
      differencePercentage,
      explanation
    }
  };
}

/**
 * Runs the complete automated test suite validating edge cases from Phase 20 and 21.
 */
export function runAutomatedVerificationTests(): TestSuiteResult {
  const results: TestCaseResult[] = [];

  // TEST 1: Prediction: FT = 1, HT = Under 1.5 | Actual: HT = 0-0, FT = 2-0 => HT = WON, FT = WON
  (() => {
    const ftEval = evaluateFT1X2('1', 2, 0, 'VERIFIED');
    const htEval = evaluateHTMarket('HT Under 1.5 Goals', 'Under 1.5', 0, 0, 'VERIFIED');
    const passed = ftEval.status === 'won' && htEval.status === 'won' && ftEval.actualResult === '1';
    results.push({
      id: 'TEST-1',
      name: 'Clean Home Win & Low Scoring First Half',
      description: 'FT: 1, HT: Under 1.5 with actual HT 0-0, FT 2-0',
      passed,
      expected: { htStatus: 'won', ftStatus: 'won', actualFtResult: '1' },
      actual: { htStatus: htEval.status, ftStatus: ftEval.status, actualFtResult: ftEval.actualResult }
    });
  })();

  // TEST 2: Prediction: FT = 1, HT = Under 1.5 | Actual: HT = 1-1, FT = 2-1 => HT = LOST, FT = WON
  (() => {
    const ftEval = evaluateFT1X2('1', 2, 1, 'VERIFIED');
    const htEval = evaluateHTMarket('HT Under 1.5 Goals', 'Under 1.5', 1, 1, 'VERIFIED');
    const passed = ftEval.status === 'won' && htEval.status === 'lost' && ftEval.actualResult === '1';
    results.push({
      id: 'TEST-2',
      name: 'High Scoring First Half with Eventual Home Win',
      description: 'FT: 1, HT: Under 1.5 with actual HT 1-1 (2 goals), FT 2-1',
      passed,
      expected: { htStatus: 'lost', ftStatus: 'won', actualFtResult: '1' },
      actual: { htStatus: htEval.status, ftStatus: ftEval.status, actualFtResult: ftEval.actualResult }
    });
  })();

  // TEST 3: Prediction: FT = X, HT = Under 1.5 | Actual: HT = 0-0, FT = 1-1 => HT = WON, FT = WON
  (() => {
    const ftEval = evaluateFT1X2('X', 1, 1, 'VERIFIED');
    const htEval = evaluateHTMarket('HT Under 1.5 Goals', 'Under 1.5', 0, 0, 'VERIFIED');
    const passed = ftEval.status === 'won' && htEval.status === 'won' && ftEval.actualResult === 'X';
    results.push({
      id: 'TEST-3',
      name: 'Draw Prediction with Low Scoring HT and Score Draw at FT',
      description: 'FT: X, HT: Under 1.5 with actual HT 0-0, FT 1-1',
      passed,
      expected: { htStatus: 'won', ftStatus: 'won', actualFtResult: 'X' },
      actual: { htStatus: htEval.status, ftStatus: ftEval.status, actualFtResult: ftEval.actualResult }
    });
  })();

  // TEST 4: Prediction: FT = 2, HT = Under 1.5 | Actual: HT = 0-1, FT = 0-2 => HT = WON, FT = WON
  (() => {
    const ftEval = evaluateFT1X2('2', 0, 2, 'VERIFIED');
    const htEval = evaluateHTMarket('HT Under 1.5 Goals', 'Under 1.5', 0, 1, 'VERIFIED');
    const passed = ftEval.status === 'won' && htEval.status === 'won' && ftEval.actualResult === '2';
    results.push({
      id: 'TEST-4',
      name: 'Away Win with 1-Goal First Half Lead',
      description: 'FT: 2, HT: Under 1.5 with actual HT 0-1 (1 goal), FT 0-2',
      passed,
      expected: { htStatus: 'won', ftStatus: 'won', actualFtResult: '2' },
      actual: { htStatus: htEval.status, ftStatus: ftEval.status, actualFtResult: ftEval.actualResult }
    });
  })();

  // TEST 5: Prediction: FT = 1, HT = Under 1.5 | Actual: HT = 2-0, FT = 2-0 => HT = LOST, FT = WON
  (() => {
    const ftEval = evaluateFT1X2('1', 2, 0, 'VERIFIED');
    const htEval = evaluateHTMarket('HT Under 1.5 Goals', 'Under 1.5', 2, 0, 'VERIFIED');
    const passed = ftEval.status === 'won' && htEval.status === 'lost' && ftEval.actualResult === '1';
    results.push({
      id: 'TEST-5',
      name: 'Early 2-0 Halftime Lead',
      description: 'FT: 1, HT: Under 1.5 with actual HT 2-0 (2 goals => Lost HT), FT 2-0 (Home Win => Won FT)',
      passed,
      expected: { htStatus: 'lost', ftStatus: 'won', actualFtResult: '1' },
      actual: { htStatus: htEval.status, ftStatus: ftEval.status, actualFtResult: ftEval.actualResult }
    });
  })();

  // TEST 6: Result Correction | Initial FT = 1-0 (Pick 1 => Won), Verified FT = 2-2 (Pick 1 => Lost, Result X)
  (() => {
    const initialEval = evaluateFT1X2('1', 1, 0, 'VERIFIED');
    const correctedEval = evaluateFT1X2('1', 2, 2, 'VERIFIED');
    const passed =
      initialEval.status === 'won' &&
      correctedEval.status === 'lost' &&
      correctedEval.actualResult === 'X';
    results.push({
      id: 'TEST-6',
      name: 'Dynamic Result Correction Handling',
      description: 'Score corrected from 1-0 to 2-2 automatically recalculates FT status from Won to Lost and Result from 1 to X',
      passed,
      expected: { initialStatus: 'won', correctedStatus: 'lost', correctedActualResult: 'X' },
      actual: {
        initialStatus: initialEval.status,
        correctedStatus: correctedEval.status,
        correctedActualResult: correctedEval.actualResult
      }
    });
  })();

  // TEST 7: Data Quality Rule: FT cannot have fewer goals than HT (e.g. HT 2-1, FT 1-0)
  (() => {
    const validation = validateScores(2, 1, 1, 0);
    const passed = !validation.valid;
    results.push({
      id: 'TEST-7',
      name: 'Data Quality Validation (Impossible Score HT > FT)',
      description: 'Reject or flag scores where FT has fewer goals than HT (HT 2-1, FT 1-0)',
      passed,
      expected: { valid: false },
      actual: { valid: validation.valid, reason: validation.reason }
    });
  })();

  // TEST 8: Conflict Detection: Match marked as CONFLICTED / NEEDS_REVIEW does not count as Won or Lost
  (() => {
    const ftEval = evaluateFT1X2('1', 2, 1, 'CONFLICTED');
    const htEval = evaluateHTMarket('HT Under 1.5 Goals', 'Under 1.5', 0, 0, 'CONFLICTED');
    const passed = ftEval.status === 'needs_review' && htEval.status === 'needs_review';
    results.push({
      id: 'TEST-8',
      name: 'Conflict Safety (Conflicted matches must NOT count as Lost/Won)',
      description: 'Conflicted records stay in NEEDS_REVIEW state until authoritative resolution',
      passed,
      expected: { ftStatus: 'needs_review', htStatus: 'needs_review' },
      actual: { ftStatus: ftEval.status, htStatus: htEval.status }
    });
  })();

  // TEST 9: Unverified / Pending match does not count as a loss
  (() => {
    const ftEval = evaluateFT1X2('1', null, null, 'PENDING_VERIFICATION');
    const htEval = evaluateHTMarket('HT Under 1.5 Goals', 'Under 1.5', null, null, 'PENDING_VERIFICATION');
    const dnbEval = evaluateDNB('1', null, null, 'PENDING_VERIFICATION');
    const passed = ftEval.status === 'pending' && htEval.status === 'pending' && dnbEval.status === 'pending';
    results.push({
      id: 'TEST-9',
      name: 'Pending Match Handling (FT, HT & DNB)',
      description: 'Unfinished or unverified matches remain PENDING without polluting loss statistics',
      passed,
      expected: { ftStatus: 'pending', htStatus: 'pending', dnbStatus: 'pending' },
      actual: { ftStatus: ftEval.status, htStatus: htEval.status, dnbStatus: dnbEval.status }
    });
  })();

  // TEST 10: DNB Home Win Scenario | Pick: 1 (Home DNB), FT: 2-0 => DNB Status = WON
  (() => {
    const dnbEval = evaluateDNB('1', 2, 0, 'VERIFIED');
    const passed = dnbEval.status === 'won' && dnbEval.actualResult === 'WON';
    results.push({
      id: 'TEST-10',
      name: 'DNB Home Pick Victory',
      description: 'Pick: Home DNB (1), Actual FT: 2-0 => DNB result is WON',
      passed,
      expected: { dnbStatus: 'won', actualResult: 'WON' },
      actual: { dnbStatus: dnbEval.status, actualResult: dnbEval.actualResult }
    });
  })();

  // TEST 11: DNB Draw Void Scenario | Pick: 1 (Home DNB), FT: 1-1 => DNB Status = VOID (Push/Refund)
  (() => {
    const dnbEval = evaluateDNB('1', 1, 1, 'VERIFIED');
    const passed = dnbEval.status === 'void' && dnbEval.actualResult === 'VOID';
    results.push({
      id: 'TEST-11',
      name: 'DNB Draw Handled as VOID (Push/Refund)',
      description: 'Pick: Home DNB (1), Actual FT: 1-1 => DNB result is VOID (Refunded stake, NEVER loss or win)',
      passed,
      expected: { dnbStatus: 'void', actualResult: 'VOID' },
      actual: { dnbStatus: dnbEval.status, actualResult: dnbEval.actualResult }
    });
  })();

  // TEST 12: DNB Home Pick Defeat | Pick: 1 (Home DNB), FT: 0-2 => DNB Status = LOST
  (() => {
    const dnbEval = evaluateDNB('1', 0, 2, 'VERIFIED');
    const passed = dnbEval.status === 'lost' && dnbEval.actualResult === 'LOST';
    results.push({
      id: 'TEST-12',
      name: 'DNB Home Pick Defeat',
      description: 'Pick: Home DNB (1), Actual FT: 0-2 (Away Win) => DNB result is LOST',
      passed,
      expected: { dnbStatus: 'lost', actualResult: 'LOST' },
      actual: { dnbStatus: dnbEval.status, actualResult: dnbEval.actualResult }
    });
  })();

  // TEST 13: DNB Away Pick Victory | Pick: 2 (Away DNB), FT: 1-3 => DNB Status = WON
  (() => {
    const dnbEval = evaluateDNB('2', 1, 3, 'VERIFIED');
    const passed = dnbEval.status === 'won' && dnbEval.actualResult === 'WON';
    results.push({
      id: 'TEST-13',
      name: 'DNB Away Pick Victory',
      description: 'Pick: Away DNB (2), Actual FT: 1-3 => DNB result is WON',
      passed,
      expected: { dnbStatus: 'won', actualResult: 'WON' },
      actual: { dnbStatus: dnbEval.status, actualResult: dnbEval.actualResult }
    });
  })();

  // TEST 14: DNB Away Pick Draw Void | Pick: 2 (Away DNB), FT: 2-2 => DNB Status = VOID
  (() => {
    const dnbEval = evaluateDNB('2', 2, 2, 'VERIFIED');
    const passed = dnbEval.status === 'void' && dnbEval.actualResult === 'VOID';
    results.push({
      id: 'TEST-14',
      name: 'DNB Away Pick Draw Handled as VOID',
      description: 'Pick: Away DNB (2), Actual FT: 2-2 => DNB result is VOID (Refunded stake)',
      passed,
      expected: { dnbStatus: 'void', actualResult: 'VOID' },
      actual: { dnbStatus: dnbEval.status, actualResult: dnbEval.actualResult }
    });
  })();

  // TEST 15: DNB Accuracy Calculation with Voids Excluded from Denominator
  (() => {
    const mockAuditRecords: AccuracyAuditRecord[] = [
      { matchId: 1, match: 'M1', competition: 'L1', scheduledTime: 'T1', homeTeam: 'H1', awayTeam: 'A1', ftPrediction: '1', verifiedFtScore: '2-0', actualFtResult: '1', ftStatus: 'WON', htPrediction: 'U1.5', verifiedHtScore: '1-0', htTotalGoals: 1, htStatus: 'WON', dnbPrediction: '1', dnbStatus: 'WON', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 },
      { matchId: 2, match: 'M2', competition: 'L1', scheduledTime: 'T2', homeTeam: 'H2', awayTeam: 'A2', ftPrediction: '1', verifiedFtScore: '3-1', actualFtResult: '1', ftStatus: 'WON', htPrediction: 'U1.5', verifiedHtScore: '1-0', htTotalGoals: 1, htStatus: 'WON', dnbPrediction: '1', dnbStatus: 'WON', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 },
      { matchId: 3, match: 'M3', competition: 'L1', scheduledTime: 'T3', homeTeam: 'H3', awayTeam: 'A3', ftPrediction: '1', verifiedFtScore: '1-0', actualFtResult: '1', ftStatus: 'WON', htPrediction: 'U1.5', verifiedHtScore: '0-0', htTotalGoals: 0, htStatus: 'WON', dnbPrediction: '1', dnbStatus: 'WON', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 },
      { matchId: 4, match: 'M4', competition: 'L1', scheduledTime: 'T4', homeTeam: 'H4', awayTeam: 'A4', ftPrediction: '1', verifiedFtScore: '2-1', actualFtResult: '1', ftStatus: 'WON', htPrediction: 'U1.5', verifiedHtScore: '1-0', htTotalGoals: 1, htStatus: 'WON', dnbPrediction: '1', dnbStatus: 'WON', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 },
      { matchId: 5, match: 'M5', competition: 'L1', scheduledTime: 'T5', homeTeam: 'H5', awayTeam: 'A5', ftPrediction: '1', verifiedFtScore: '0-2', actualFtResult: '2', ftStatus: 'LOST', htPrediction: 'U1.5', verifiedHtScore: '0-1', htTotalGoals: 1, htStatus: 'WON', dnbPrediction: '1', dnbStatus: 'LOST', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 },
      // 3 Voids (Draws)
      { matchId: 6, match: 'M6', competition: 'L1', scheduledTime: 'T6', homeTeam: 'H6', awayTeam: 'A6', ftPrediction: '1', verifiedFtScore: '1-1', actualFtResult: 'X', ftStatus: 'LOST', htPrediction: 'U1.5', verifiedHtScore: '0-0', htTotalGoals: 0, htStatus: 'WON', dnbPrediction: '1', dnbStatus: 'VOID', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 },
      { matchId: 7, match: 'M7', competition: 'L1', scheduledTime: 'T7', homeTeam: 'H7', awayTeam: 'A7', ftPrediction: '1', verifiedFtScore: '0-0', actualFtResult: 'X', ftStatus: 'LOST', htPrediction: 'U1.5', verifiedHtScore: '0-0', htTotalGoals: 0, htStatus: 'WON', dnbPrediction: '1', dnbStatus: 'VOID', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 },
      { matchId: 8, match: 'M8', competition: 'L1', scheduledTime: 'T8', homeTeam: 'H8', awayTeam: 'A8', ftPrediction: '1', verifiedFtScore: '2-2', actualFtResult: 'X', ftStatus: 'LOST', htPrediction: 'U1.5', verifiedHtScore: '1-1', htTotalGoals: 2, htStatus: 'LOST', dnbPrediction: '1', dnbStatus: 'VOID', resultSource: 'Sofascore', verificationStatus: 'VERIFIED', verificationTimestamp: '2026-01-01', resultVersion: 1 }
    ];

    const metrics = calculateAccuracyMetrics(mockAuditRecords);
    // 4 Wins, 1 Loss, 3 Voids => Decided = 5, Wins = 4 => Accuracy = 4 / 5 * 100 = 80.0%
    const passed =
      metrics.dnbStats.correct === 4 &&
      metrics.dnbStats.incorrect === 1 &&
      metrics.dnbStats.voids === 3 &&
      metrics.dnbStats.accuracyPercentage === 80.0;

    results.push({
      id: 'TEST-15',
      name: 'DNB Void Exclusion from Accuracy Denominator',
      description: '4 Wins, 1 Loss, 3 Voids => Accuracy = 4 / (4 + 1) * 100 = 80.0% (3 Voids excluded from denominator)',
      passed,
      expected: { correct: 4, incorrect: 1, voids: 3, accuracyPercentage: 80.0 },
      actual: {
        correct: metrics.dnbStats.correct,
        incorrect: metrics.dnbStats.incorrect,
        voids: metrics.dnbStats.voids,
        accuracyPercentage: metrics.dnbStats.accuracyPercentage
      }
    });
  })();

  const passedCount = results.filter((r) => r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    timestamp: new Date().toISOString(),
    results
  };
}
