/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MatchVerificationStatus = 'VERIFIED' | 'PENDING_VERIFICATION' | 'NEEDS_REVIEW' | 'CONFLICTED';

export type MatchLifecycleState =
  | 'SCHEDULED'
  | 'LIVE'
  | 'HALF_TIME'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'ABANDONED'
  | 'SUSPENDED'
  | 'NEEDS_REVIEW';

export interface CorrectScorePrediction {
  score: string;
  probability: number;
}

export interface FullTime1X2Prediction {
  prediction: '1' | 'X' | '2'; // 1 = Home Win, X = Draw, 2 = Away Win
  label: string; // e.g. "Home Win (1)", "Draw (X)", "Away Win (2)"
  confidence: number; // percentage, e.g. 79.5
  probabilities: {
    homeWin: number; // e.g. 0.58
    draw: number; // e.g. 0.24
    awayWin: number; // e.g. 0.18
  };
  doubleChance: string; // e.g. "1X (Home or Draw)"
  doubleChanceProb: number; // e.g. 0.82
  predictedFtScore: string; // e.g. "2-1"
  analysis: string; // e.g. "Dominant home unbeaten streak and conversion rate support a full-time 1X2 Home Win."
  predictionResult?: 'won' | 'lost' | 'pending' | 'needs_review';
  actualFtResult?: '1' | 'X' | '2' | 'PENDING' | 'INVALID';
  verifiedFtScore?: string;
}

export interface DnbPrediction {
  pick: '1' | '2' | 'NO_PICK'; // 1 = Home DNB, 2 = Away DNB, NO_PICK = unsuited
  team: string; // e.g. "Real Madrid"
  label: string; // e.g. "Real Madrid (DNB)"
  confidence: number; // percentage, e.g. 84.5
  probabilities: {
    homeDnb: number; // Draw removed: e.g. 0.72
    awayDnb: number; // Draw removed: e.g. 0.28
  };
  oddsEstimate?: string; // e.g. "1.45"
  analysis: string;
  predictionResult?: 'won' | 'lost' | 'void' | 'pending' | 'needs_review' | 'no_pick';
  actualDnbResult?: 'WON' | 'LOST' | 'VOID' | 'PENDING' | 'INVALID' | 'NO_PICK';
  verifiedFtScore?: string;
}

export interface ValueBetDetail {
  hasValue: boolean;
  market: string; // e.g. "Full-Time 1X2", "Over 2.5 Goals", "Both Teams to Score", "Draw No Bet"
  selection: string; // e.g. "Arsenal Win", "Over 2.5 Goals"
  modelProbability: number; // 0.00 - 1.00
  fairOdds: number; // 1 / modelProbability
  marketOdds: number; // Simulated closing market odds
  edgePercentage: number; // e.g. +14.5%
  expectedValue: number; // e.g. +0.145
  recommendedStakeUnits: number; // e.g. 1.5 units
  confidenceGrade: 'A+' | 'A' | 'B+' | 'B';
  reasoning: string;
}

export interface Prediction {
  market: string; // e.g. "HT Under 1.5 Goals", "HT Over 0.5 Goals", "HT Correct Score"
  outcome: string; // e.g. "Under 1.5", "Over 0.5", "0-0"
  confidence: number | null;
  reasoning: string[];
  key_factors: string[];
  model_confidence_explanation: string;
  risk_warning: string;
  correct_score_top3: CorrectScorePrediction[];
  predictionResult?: 'won' | 'lost' | 'pending' | 'needs_review';
  fullTime1X2?: FullTime1X2Prediction;
  dnb?: DnbPrediction;
  valueBet?: ValueBetDetail;
  
  // Independent Half-Time Evaluation Fields
  htPredictionResult?: 'won' | 'lost' | 'pending' | 'needs_review';
  verifiedHtScore?: string;
  htTotalGoals?: number | 'N/A';
}

export interface Team {
  name: string;
  logo: string;
  unbeatenStreak?: string; // e.g. "6G"
}

export interface VerifiedScores {
  halfTimeHome: number | null;
  halfTimeAway: number | null;
  fullTimeHome: number | null;
  fullTimeAway: number | null;
}

export interface PlayerAbsence {
  player: string;
  position?: string;
  reason: string; // e.g. "Hamstring injury", "Red card suspension", "Doubtful illness"
  status: 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE';
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedReturn?: string;
  sourceUrl?: string;
}

export interface GroundedTeamLineup {
  formation: string; // e.g. "4-3-3", "4-2-3-1", "3-5-2"
  isConfirmed: boolean;
  startingXI: string[];
  bench?: string[];
  manager?: string;
  tacticalNotes?: string;
}

export interface GroundingWebSource {
  title: string;
  uri: string;
  domain?: string;
}

export interface DeepResearchAudit {
  lastAuditTimestamp: string;
  googleSearchQueryUrl: string;
  sofascoreUrl: string;
  flashscoreUrl: string;
  transfermarktUrl: string;
  injurySeverityScore: number; // 0 - 100 overall impact
  tacticalVulnerabilityWarning?: string;
  refereeDisciplinaryProfile?: string;
  pressConferenceQuotes?: string[];
}

export interface GroundedMatchIntel {
  matchId: number;
  fixtureVerified: boolean;
  isScheduledForTargetDate?: boolean;
  actualScheduledDate?: string;
  schedulingNote?: string;
  officialKickoff?: string;
  venue?: string;
  referee?: string;
  homeLineup: GroundedTeamLineup;
  awayLineup: GroundedTeamLineup;
  homeAbsences: PlayerAbsence[];
  awayAbsences: PlayerAbsence[];
  weatherConditions?: string;
  keyTacticalInsights: string[];
  groundedSummary: string;
  searchQueriesUsed: string[];
  sources: GroundingWebSource[];
  deepAudit?: DeepResearchAudit;
  verifiedAt: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export type MatchDataStatus = 'SYNCED' | 'UPDATING' | 'RECALCULATED' | 'OFFICIAL' | 'VERIFIED';
export type LineupReleaseStatus = 'NO_LINEUP' | 'PREDICTED' | 'CONFIRMED';

export type AlertEventType =
  | 'GOAL'
  | 'LINEUP_CONFIRMED'
  | 'KICKOFF'
  | 'FULLTIME'
  | 'PREDICTION_RECALCULATED'
  | 'RED_CARD'
  | 'PREDICTION_WON'
  | 'PREDICTION_LOST'
  | 'PREDICTION_VOID'
  | 'MATCHDAY_STARTED'
  | 'EMAIL_VERIFICATION';

export interface LiveAlertEvent {
  id: string;
  matchId: number;
  matchName: string;
  competition?: string;
  eventType: AlertEventType;
  title: string;
  body: string;
  timestamp: string;
  kampalaTime: string;
  score?: string;
  minute?: string;
  teamName?: string;
  isRead?: boolean;
  predictionOutcome?: 'WON' | 'LOST' | 'VOID';
  marketName?: string;
  predictedPick?: string;
  confidence?: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  notifyGoals: boolean;
  notifyLineups: boolean;
  notifyRecalculations: boolean;
  notifyFullTime: boolean;
  notifyOutcomes: boolean;
  backgroundPushEnabled: boolean;
}

export interface AutomationLogEntry {
  id: string;
  timestamp: string;
  kampalaTime: string;
  level: 'info' | 'sync' | 'lineup' | 'injury' | 'recalc' | 'settle' | 'warn';
  message: string;
  matchId?: number;
  matchName?: string;
}

export interface AutomationStatusPayload {
  isActive: boolean;
  activeDateEAT: string;
  kampalaTime: string;
  activePhase: 'DISCOVERY' | 'LINEUP_SYNC' | 'INJURY_AUDIT' | 'PREDICTION_RECALC' | 'SETTLEMENT' | 'IDLE';
  lastRunTimestamp: string;
  nextScheduledRun: string;
  refreshFrequencySec: number;
  totalMonitoredFixtures: number;
  upcomingCount: number;
  liveCount: number;
  finishedCount: number;
  autoConfirmedLineupsCount: number;
  autoRecalculationsCount: number;
  autoSettledCount: number;
  recentLogs: AutomationLogEntry[];
  recentAlerts?: LiveAlertEvent[];
}

export interface Match {
  id: number;
  providerMatchId?: string | number;
  competition?: string;
  scheduledStartTime?: string;
  kickoffTimestamp?: number | string;
  kampalaDate?: string;
  status: 'live' | 'upcoming' | 'finished';
  lifecycleState?: MatchLifecycleState;
  match: string;
  time: string;
  currentScore: string;
  homeTeam: Team;
  awayTeam: Team;
  momentumIndex: number;
  combinedShotsOnTarget: number;
  dangerousAttacks: number;
  unbeatenComparison?: string; // e.g. "6G vs 2G"
  prediction: Prediction;

  // Fully Automated System Telemetry & Freshness
  lastFetchedAt?: string;
  lastVerifiedAt?: string;
  dataStatus?: MatchDataStatus;
  lineupStatus?: LineupReleaseStatus;
  autoRecalculatedAt?: string;
  autoSettledAt?: string;

  // Real-Time Google Search Grounding Intel (SofaScore, FlashScore, etc.)
  groundedIntel?: GroundedMatchIntel;

  // Single Source of Truth Match Result Storage
  verifiedScores?: VerifiedScores;
  resultSource?: string;
  resultSourceMatchId?: string | number;
  resultVerificationStatus?: MatchVerificationStatus;
  firstResultReceivedAt?: string;
  lastResultUpdatedAt?: string;
  resultVersion?: number;
  conflictDetails?: string;
}

export interface MarketAccuracyStats {
  totalVerified: number;
  correct: number;
  incorrect: number;
  voids?: number;
  accuracyPercentage: number;
}

export interface DataQualityStats {
  totalMatches: number;
  verified: number;
  pending: number;
  conflicted: number;
  corrected: number;
}

export interface AccuracyAuditRecord {
  matchId: number;
  match: string;
  competition: string;
  scheduledTime: string;
  kampalaDate?: string;
  homeTeam: string;
  awayTeam: string;

  // FT 1X2 Evaluation
  ftPrediction: '1' | 'X' | '2';
  verifiedFtScore: string;
  actualFtResult: '1' | 'X' | '2' | 'PENDING' | 'INVALID';
  ftStatus: 'WON' | 'LOST' | 'PENDING' | 'NEEDS_REVIEW';

  // HT Evaluation
  htPrediction: string; // e.g. "Under 1.5"
  verifiedHtScore: string;
  htTotalGoals: number | string;
  htStatus: 'WON' | 'LOST' | 'PENDING' | 'NEEDS_REVIEW';

  // DNB Evaluation
  dnbPrediction?: '1' | '2' | 'NO_PICK';
  dnbTeam?: string;
  dnbStatus?: 'WON' | 'LOST' | 'VOID' | 'PENDING' | 'NEEDS_REVIEW' | 'NO_PICK';

  // Audit Info
  resultSource: string;
  verificationStatus: MatchVerificationStatus;
  verificationTimestamp: string;
  resultVersion: number;
}

export interface CalibrationBucket {
  range: string; // e.g. "50–55%"
  minProb: number;
  maxProb: number;
  predictedProbability: number;
  actualWinRate: number;
  predictionCount: number;
  calibrationError: number;
}

export interface DetailedMarketMetrics {
  market: string;
  total: number;
  correct: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  brierScore: number;
  logLoss: number;
  roiPercentage: number;
}

export interface AccuracyDashboardPayload {
  ftStats: MarketAccuracyStats;
  htStats: MarketAccuracyStats;
  dnbStats: MarketAccuracyStats;
  dataQuality: DataQualityStats;
  comparativeVerdict: {
    moreAccurateMarket: 'HT Under 1.5' | 'FT 1X2' | 'Draw No Bet (DNB)' | 'Equal Accuracy' | 'Insufficient Data';
    differencePercentage: number;
    explanation: string;
  };
  auditRecords: AccuracyAuditRecord[];
  brierScoreFt: string;
  brierScoreHt: string;
  brierScoreDnb: string;
  logLoss: string;
  expectedCalibrationError?: number;
  calibrationBuckets?: CalibrationBucket[];
  marketBreakdown?: Record<string, DetailedMarketMetrics>;
  overallRoi?: number;
  calibrationData: { prob_pred: number; prob_true: number }[];
  lastReconciledAt: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  expected: Record<string, any>;
  actual: Record<string, any>;
  error?: string;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  timestamp: string;
  results: TestCaseResult[];
}

export interface HistoricalPredictionRecord {
  id: string | number;
  matchId: number;
  match: string;
  competition: string;
  matchDate: string; // YYYY-MM-DD
  homeTeam: string;
  awayTeam: string;
  market: 'FT 1X2' | 'Draw No Bet' | 'HT Under 1.5' | 'Correct Score';
  predictedPick: string;
  predictedScore?: string;
  confidence: number;
  oddsEstimate?: string;
  verifiedHtScore: string;
  verifiedFtScore: string;
  outcome: 'WON' | 'LOST' | 'VOID' | 'PENDING';
  unitReturn: number; // e.g. +0.85, -1.0, 0.0
  settledAt: string;
  source: string;
  notes?: string;
}

export interface HistoricalStatsPayload {
  totalSettled: number;
  totalWon: number;
  totalLost: number;
  totalVoid: number;
  winRate: number; // percentage
  netProfitUnits: number;
  roiPercentage: number;
  records: HistoricalPredictionRecord[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;
  phone?: string;
  country?: string;
  isVerified: boolean;
  verificationCode?: string;
  resetPasswordToken?: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLoginAt?: string;
  lastIp?: string;
  userAgent?: string;
  isAppInstalled?: boolean;
  installedAt?: string;
  bookmarkedMatchIds?: number[];
  customNotes?: string;
}

export interface AppInstallLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  platform: string; // 'Android', 'iOS', 'Windows', 'macOS', 'Linux', 'Web'
  browser: string;
  userAgent: string;
  ipAddress?: string;
  installOutcome: 'ACCEPTED' | 'DISMISSED' | 'STANDALONE_LAUNCH';
  referrer?: string;
}

export interface AuthSessionPayload {
  token: string;
  user: Omit<UserAccount, 'passwordHash' | 'verificationCode'>;
  expiresAt: string;
}

export interface AdminMetricsPayload {
  totalUsers: number;
  verifiedUsers: number;
  activeToday: number;
  totalAppInstalls: number;
  totalPredictionsSettled: number;
  bannedUsers: number;
  recentInstalls: AppInstallLogEntry[];
}

// --- AI DEEP MATCH ANALYSIS & BEST-PICKS BOT TYPES ---

export interface MultiModelOutput {
  poisson: {
    homeWin: number;
    draw: number;
    awayWin: number;
    expectedGoalsHome: number;
    expectedGoalsAway: number;
    over15: number;
    under15: number;
    over25: number;
    under25: number;
    bttsYes: number;
    bttsNo: number;
  };
  dixonColes: {
    homeWin: number;
    draw: number;
    awayWin: number;
    lowScoreCorrectionApplied: boolean;
  };
  elo: {
    homeWin: number;
    draw: number;
    awayWin: number;
    ratingDiff: number;
  };
  xgModel: {
    homeWin: number;
    draw: number;
    awayWin: number;
    xgDiff: number;
  };
  formModel: {
    homeWin: number;
    draw: number;
    awayWin: number;
    momentumRatio: number;
  };
  groundedAi: {
    homeWin: number;
    draw: number;
    awayWin: number;
    tacticalConfidence: number;
  };
  ensemble: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  modelAgreementPercent: number; // 0 - 100% consensus score
}

export type BotMarketType = '1X2' | 'DOUBLE_CHANCE' | 'DNB' | 'OVER_UNDER_GOALS' | 'BTTS' | 'ASIAN_HANDICAP';

export interface MarketAnalysisItem {
  marketType: BotMarketType;
  marketName: string;
  selection: string; // e.g. "West Ham United (DNB)", "Over 1.5 Goals", "Home Win (1)"
  modelProbability: number; // 0 - 1
  impliedProbability: number; // 1 / odds
  odds: string; // e.g. "1.45"
  edgePercentage: number; // e.g. 8.2 (+8.2%)
  confidence: number; // 0 - 100
  modelAgreement: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  isQualified: boolean;
  disqualificationReason?: string;
  qualityScore: number;
}

export interface QualifiedPick {
  id: string;
  rank: number;
  matchId: number;
  matchName: string;
  competition: string;
  kickoffTime: string;
  homeTeam: Team;
  awayTeam: Team;
  marketType: BotMarketType;
  marketName: string;
  pick: string;
  odds: string;
  confidence: number;
  modelProbability: number;
  impliedProbability: number;
  edgePercentage: number;
  modelAgreement: number;
  qualityScore: number;
  supportingFactors: string[];
  riskFactors: string[];
  tacticalNotes: string;
  modelBreakdown: MultiModelOutput;
  absenceImpact: {
    highCount: number;
    mediumCount: number;
    details: string[];
  };
  researchTimestamp: string;
  reconciliation?: {
    actualResult?: string;
    outcome?: 'WON' | 'LOST' | 'VOID' | 'PENDING';
    settledScore?: string;
    settledAt?: string;
  };
}

export interface AnalyzedMatchProfile {
  matchId: number;
  matchName: string;
  competition: string;
  status: 'upcoming' | 'live' | 'finished';
  multiModel: MultiModelOutput;
  evaluatedMarkets: MarketAnalysisItem[];
  topCandidatePick?: MarketAnalysisItem;
  isQualified: boolean;
  rejectionReason?: string;
  squadCertainty: number;
  intelSummary: string;
  analyzedAt: string;
}

export interface AnalysisSnapshot {
  analysisId: string;
  version: number;
  timestamp: string;
  kampalaDate: string;
  totalAnalyzed: number;
  qualifiedCount: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  lockedFixtureIds: number[];
  topPicks: QualifiedPick[];
  analyzedMatches: AnalyzedMatchProfile[];
  noPickReason?: string;
  executionDurationMs?: number;
  sourcesAuditedCount?: number;
}

export interface AiBotJobProgress {
  jobId: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  stage: 'LOCKING_FIXTURES' | 'RESEARCHING_INTEL' | 'RUNNING_MODELS' | 'EVALUATING_MARKETS' | 'FILTERING_RISK' | 'RANKING_PICKS' | 'DONE';
  stageDescription: string;
  progressPercent: number;
  completedMatches: number;
  totalMatches: number;
  currentMatchName?: string;
  error?: string;
}
