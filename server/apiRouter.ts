/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Entry Router Source
 * Exposes all Express API routes and automation stores for Vercel deployment.
 */

import express from 'express';
import path from 'path';
import type { Match } from '../src/types';
import { globalMatchStore } from '../src/matchStore';
import { globalHistoryStore } from '../src/historyStore';
import { globalAuthStore } from '../src/authStore';
import { globalEmailService } from './emailService';
import { globalAutomationEngine } from '../src/automationEngine';
import { runAutomatedVerificationTests } from '../src/verificationEngine';
import {
  verifyMatchIntelWithGoogleSearch,
  getCachedMatchIntel
} from '../src/searchGroundingService';
import { runBatchAiAnalysis } from '../src/services/aiPredictionBotEngine';
import { globalAiSnapshotStore } from '../src/services/aiSnapshotStore';
import { globalLiveScoreboard } from '../src/services/liveScoreboardService';
import type { AiBotJobProgress } from '../src/types';
import {
  getKampalaDateInfo,
  getKampalaTodayDateStr,
  isFixtureTodayInKampala,
  formatKampalaTime,
  getKampalaDateFromTimestamp,
  TARGET_TIMEZONE
} from '../src/timezoneUtils';

const app = express();

app.use(express.json());

// CORS and Cache Control Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const kampalaDateInfo = getKampalaDateInfo();
  res.json({
    status: 'ok',
    timezone: TARGET_TIMEZONE,
    todayDate: kampalaDateInfo.dateStr,
    todayStart: kampalaDateInfo.todayStartIso,
    todayEnd: kampalaDateInfo.todayEndIso,
    timestamp: new Date().toISOString()
  });
});

// Automation Status
app.get('/api/automation/status', (req, res) => {
  try {
    const status = globalAutomationEngine.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve automation status' });
  }
});

// Real-Time Live Push Alerts
app.get('/api/automation/alerts', (req, res) => {
  try {
    const since = req.query.since as string | undefined;
    const alerts = globalAutomationEngine.getAlerts(since);
    res.json({ success: true, alerts, total: alerts.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve live alerts' });
  }
});

// Trigger Immediate Sync
app.post('/api/automation/trigger-sync', async (req, res) => {
  try {
    await globalAutomationEngine.runAutomationCycle();
    const status = globalAutomationEngine.getStatus();
    res.json({ success: true, message: 'Sync cycle completed', status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Sync failed' });
  }
});

// Test Alert Trigger
app.post('/api/automation/test-alert', (req, res) => {
  try {
    const { eventType, matchId } = req.body || {};
    const alert = globalAutomationEngine.triggerTestAlert(eventType || 'PREDICTION_WON', matchId);
    res.json({ success: true, alert, message: `Dispatched [${alert.eventType}] for ${alert.matchName}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Test alert failed' });
  }
});

// Goal Simulation
app.post('/api/automation/simulate-goal', (req, res) => {
  try {
    const { matchId } = req.body || {};
    const matches = globalMatchStore.getAllMatches();
    const match = (matchId ? matches.find(m => m.id === matchId) : null) || matches.find(m => m.status === 'live') || matches[0];
    
    if (!match) {
      return res.status(404).json({ success: false, error: 'No fixture found' });
    }

    const parts = (match.currentScore || '0-0').split('-').map(p => parseInt(p.trim(), 10) || 0);
    const isHomeScoring = Math.random() > 0.4;
    if (isHomeScoring) parts[0] += 1;
    else parts[1] = (parts[1] || 0) + 1;
    const newScore = `${parts[0]}-${parts[1]}`;
    match.currentScore = newScore;
    match.status = 'live';
    match.time = `${Math.floor(Math.random() * 40 + 45)}'`;

    const scoringTeam = isHomeScoring ? match.homeTeam.name : match.awayTeam.name;
    const alert = globalAutomationEngine.broadcastAlert({
      matchId: match.id,
      matchName: match.match,
      competition: match.competition,
      eventType: 'GOAL',
      title: `⚽ GOAL! ${scoringTeam} (${newScore})`,
      body: `${scoringTeam} scores in the ${match.time}! Current Score: ${match.match} ${newScore}`,
      score: newScore,
      minute: match.time,
      teamName: scoringTeam
    });

    res.json({ success: true, match, alert, message: `Goal registered: ${newScore}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Goal simulation failed' });
  }
});

// Persistent Prediction History & Outcomes Ledger with Auto-Sync
app.get('/api/history', async (req, res) => {
  try {
    const forceSync = req.query.sync === 'true' || req.query.refresh === 'true';
    const todayStr = getKampalaTodayDateStr();

    // 1. Sync finished matches from memory store
    globalMatchStore.syncFinishedMatchesToHistory();

    // 2. If sync explicitly requested or history ledger has only initial seeds, trigger live scoreboard to capture all today's finished matches
    if (forceSync || globalHistoryStore.getAllRecords().length <= 7) {
      try {
        const liveMatches = await globalLiveScoreboard.fetchRealLiveMatches(todayStr, forceSync);
        if (liveMatches && liveMatches.length > 0) {
          globalMatchStore.upsertMatches(liveMatches);
          globalHistoryStore.syncFinishedMatches(liveMatches);
        }
      } catch (e) {
        console.warn('[History Auto-Sync Notice] Live feed sync fallback:', e);
      }
    }

    const stats = globalHistoryStore.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/history/stats', (req, res) => {
  try {
    globalMatchStore.syncFinishedMatchesToHistory();
    const stats = globalHistoryStore.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Dedicated Auto-Sync Endpoint for the Prediction History & Outcome Ledger
app.post('/api/history/sync', async (req, res) => {
  try {
    const todayStr = getKampalaTodayDateStr();
    const clientMatches = req.body?.matches as Match[] | undefined;

    if (Array.isArray(clientMatches) && clientMatches.length > 0) {
      globalMatchStore.upsertMatches(clientMatches);
      globalHistoryStore.syncFinishedMatches(clientMatches);
    }

    try {
      const liveMatches = await globalLiveScoreboard.fetchRealLiveMatches(todayStr, true);
      if (liveMatches && liveMatches.length > 0) {
        globalMatchStore.upsertMatches(liveMatches);
        globalHistoryStore.syncFinishedMatches(liveMatches);
      }
    } catch (e) {
      console.warn('[History Sync Endpoint] Scraper notice:', e);
    }

    globalMatchStore.syncFinishedMatchesToHistory();
    const stats = globalHistoryStore.getStats();
    res.json({
      success: true,
      message: `Prediction History & Outcome Ledger synchronized successfully. ${stats.totalSettled} settled predictions recorded.`,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Sync failed' });
  }
});

app.post('/api/history/clear', (req, res) => {
  try {
    globalHistoryStore.clearAll();
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Model Performance & Verification Dashboard
app.get('/api/model-performance', (req, res) => {
  const dashboard = globalMatchStore.getAccuracyDashboard();
  res.json({
    brierScore: dashboard.brierScoreFt,
    logLoss: dashboard.logLoss,
    calibrationData: dashboard.calibrationData,
    ftAccuracy: `${dashboard.ftStats.accuracyPercentage.toFixed(1)}%`,
    htAccuracy: `${dashboard.htStats.accuracyPercentage.toFixed(1)}%`
  });
});

app.get('/api/verification/accuracy-dashboard', (req, res) => {
  try {
    const dashboard = globalMatchStore.getAccuracyDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate accuracy dashboard' });
  }
});

app.get('/api/verification/audit-records', (req, res) => {
  try {
    const records = globalMatchStore.getAuditRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit records' });
  }
});

app.get('/api/historical-matches', (req, res) => {
  try {
    const matches = globalMatchStore.getHistoricalMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical matches' });
  }
});

app.post('/api/verification/reconcile', (req, res) => {
  try {
    const result = globalMatchStore.reconcileAllFinishedMatches();
    const dashboard = globalMatchStore.getAccuracyDashboard();
    res.json({ success: true, reconciliationResult: result, dashboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reconcile match records' });
  }
});

app.get('/api/verification/run-tests', (req, res) => {
  try {
    const testReport = runAutomatedVerificationTests();
    res.json(testReport);
  } catch (error) {
    console.error('Error running test suite:', error);
    res.status(500).json({ error: 'Failed to run verification test suite' });
  }
});

app.post('/api/verification/manual-verify', (req, res) => {
  try {
    const { matchId, htHome, htAway, ftHome, ftAway, adminNotes } = req.body;
    if (matchId === undefined || htHome === undefined || htAway === undefined || ftHome === undefined || ftAway === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required score fields' });
    }
    const result = globalMatchStore.manualVerifyMatch(
      Number(matchId),
      {
        htHome: Number(htHome),
        htAway: Number(htAway),
        ftHome: Number(ftHome),
        ftAway: Number(ftAway)
      },
      adminNotes || 'Admin manual verification'
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in manual verification:', error);
    res.status(500).json({ success: false, message: 'Internal server error during verification' });
  }
});

// Google Search Grounding & Intel
app.post('/api/verify-match-intel', async (req, res) => {
  try {
    const { matchId, homeTeam, awayTeam, competition, dateStr, forceRefresh } = req.body;
    if (!matchId || !homeTeam || !awayTeam) {
      return res.status(400).json({ error: 'Missing required match parameters' });
    }

    const intel = await verifyMatchIntelWithGoogleSearch({
      matchId: Number(matchId),
      homeTeam: String(homeTeam),
      awayTeam: String(awayTeam),
      competition: competition ? String(competition) : undefined,
      dateStr: dateStr ? String(dateStr) : getKampalaTodayDateStr(),
      forceRefresh: Boolean(forceRefresh),
    });

    const match = globalMatchStore.getMatchById(Number(matchId));
    if (match) {
      match.groundedIntel = intel;
      if (intel.homeLineup?.isConfirmed || intel.awayLineup?.isConfirmed) {
        match.lineupStatus = 'CONFIRMED';
      }
      globalAutomationEngine.recalculateProbabilitiesForMatch(match, 'Search intel synced');
    }

    res.json({ ...intel, success: true, match: match || undefined });
  } catch (error: any) {
    res.status(500).json({ error: 'Search Grounding failed', details: error?.message || String(error) });
  }
});

app.get('/api/match-intel/:matchId', (req, res) => {
  try {
    const matchId = Number(req.params.matchId);
    const cached = getCachedMatchIntel(matchId);
    if (cached) return res.json(cached);
    res.status(404).json({ error: 'No cached intel found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve intel' });
  }
});

// Helper for extracting current authenticated user
function getAuthUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return globalAuthStore.validateToken(token);
}

// Admin authorization middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin' || user.email.toLowerCase() !== 'dj20pndmix@gmail.com') {
    return res.status(403).json({ error: 'Master Admin Access Required', code: 'FORBIDDEN' });
  }
  (req as any).adminUser = user;
  next();
}

// --- AUTHENTICATION & VERIFICATION ENDPOINTS ---

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, avatarUrl, phone, country } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web';
    const result = globalAuthStore.register({ name, email, password, avatarUrl, phone, country, ip, userAgent });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Registration failed' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit verification code are required.' });
    }
    const result = globalAuthStore.verifyCode(email, code);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Verification failed' });
  }
});

app.post('/api/auth/resend-code', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const result = globalAuthStore.resendCode(email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to resend code' });
  }
});

app.post('/api/auth/send-verification-email', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const result = globalAuthStore.resendCode(email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to send verification email' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const result = globalAuthStore.requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to process password reset' });
  }
});

// Direct 1-Click Verification Link Handler from Email
app.get('/api/auth/verify-link', (req, res) => {
  try {
    const email = req.query.email as string;
    const code = req.query.code as string;
    if (!email || !code) {
      return res.redirect(`/?verifyError=missing_params`);
    }
    const result = globalAuthStore.verifyCode(email, code);
    if (result.success) {
      return res.redirect(`/?verifyEmail=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&verified=true`);
    } else {
      return res.redirect(`/?verifyEmail=${encodeURIComponent(email)}&verifyError=${encodeURIComponent(result.message)}`);
    }
  } catch {
    return res.redirect(`/?verifyError=server_error`);
  }
});

// Outbox email inspection endpoint (Dev & Admin)
app.get('/api/auth/outbox', (req, res) => {
  try {
    const outbox = globalEmailService.getOutbox();
    res.json({ success: true, outbox, count: outbox.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve email outbox' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web';
    const result = globalAuthStore.login(email, password, ip, userAgent);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Login failed' });
  }
});

app.post('/api/auth/guest-login', (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web';
    const result = globalAuthStore.guestLogin(ip, userAgent);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Guest login failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized or session expired' });
    }
    const { passwordHash, verificationCode, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

app.put('/api/auth/profile', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = globalAuthStore.updateProfile(user.id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// --- PWA APP INSTALLATION LOGGING ---

app.post('/api/pwa/install-log', (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web';
    const user = getAuthUser(req);

    const logEntry = globalAuthStore.logAppInstall({
      userId: user?.id || req.body.userId,
      userEmail: user?.email || req.body.userEmail,
      userName: user?.name || req.body.userName,
      platform: req.body.platform || 'Unknown',
      browser: req.body.browser || 'Web Browser',
      userAgent: userAgent,
      ipAddress: ip,
      installOutcome: req.body.installOutcome || 'ACCEPTED',
      referrer: req.body.referrer || 'App Interface'
    });

    res.status(201).json({ success: true, logEntry });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to log installation' });
  }
});

// --- MASTER ADMIN DASHBOARD & USER MANAGEMENT ---

app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    const users = globalAuthStore.getAllUsers();
    res.json({ success: true, users, count: users.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.post('/api/admin/users/:id/verify', requireAdmin, (req, res) => {
  try {
    const success = globalAuthStore.manualVerifyUser(req.params.id);
    if (!success) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User verified manually by Admin.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

app.post('/api/admin/users/:id/status', requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const success = globalAuthStore.setUserStatus(req.params.id, status);
    if (!success) return res.status(400).json({ error: 'Failed to update user status (Admin protected)' });
    res.json({ success: true, message: `User status changed to ${status}.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

app.post('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const success = globalAuthStore.setUserRole(req.params.id, role);
    if (!success) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: `User role changed to ${role}.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  try {
    const success = globalAuthStore.deleteUser(req.params.id);
    if (!success) return res.status(400).json({ error: 'Failed to delete user or user is Master Admin.' });
    res.json({ success: true, message: 'User account removed.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/admin/install-logs', requireAdmin, (req, res) => {
  try {
    const logs = globalAuthStore.getInstallLogs();
    res.json({ success: true, logs, count: logs.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load installation logs' });
  }
});

app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  try {
    const metrics = globalAuthStore.getAdminMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load admin metrics' });
  }
});

// --- AI DEEP MATCH ANALYSIS & BEST-PICKS BOT ENDPOINTS ---
let currentAiBotJobProgress: AiBotJobProgress = {
  jobId: '',
  status: 'IDLE',
  stage: 'DONE',
  stageDescription: 'Ready to run deep match analysis',
  progressPercent: 0,
  completedMatches: 0,
  totalMatches: 0
};

app.post('/api/ai-bot/analyze', async (req, res) => {
  try {
    const { fixtureIds, limit = 5, forceRefresh = false } = req.body || {};
    const allMatches = globalMatchStore.getAllMatches();

    // ABSOLUTE FIXTURE WHITELIST RULE:
    // Only process matches that currently exist in globalMatchStore
    let targetMatches: Match[] = allMatches;
    if (Array.isArray(fixtureIds) && fixtureIds.length > 0) {
      const allowedIdSet = new Set(fixtureIds.map(Number));
      targetMatches = allMatches.filter((m) => allowedIdSet.has(m.id));
    }

    if (targetMatches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid matches in the locked application whitelist to analyze.'
      });
    }

    currentAiBotJobProgress = {
      jobId: `job-${Date.now()}`,
      status: 'RUNNING',
      stage: 'LOCKING_FIXTURES',
      stageDescription: `Locked ${targetMatches.length} official application matches`,
      progressPercent: 0,
      completedMatches: 0,
      totalMatches: targetMatches.length
    };

    const snapshot = await runBatchAiAnalysis(targetMatches, {
      limit: Number(limit) || 5,
      forceRefresh: Boolean(forceRefresh),
      onProgress: (prog) => {
        currentAiBotJobProgress = prog;
      }
    });

    globalAiSnapshotStore.saveSnapshot(snapshot);
    currentAiBotJobProgress.status = 'COMPLETED';

    res.json({
      success: true,
      snapshot
    });
  } catch (error: any) {
    console.error('Error during AI batch analysis:', error);
    currentAiBotJobProgress.status = 'FAILED';
    currentAiBotJobProgress.error = error?.message || 'Analysis job failed';
    res.status(500).json({ success: false, error: error?.message || 'Failed to complete AI analysis' });
  }
});

app.get('/api/ai-bot/status', (req, res) => {
  res.json({ success: true, progress: currentAiBotJobProgress });
});

app.get('/api/ai-bot/latest', (req, res) => {
  try {
    const snapshot = globalAiSnapshotStore.getLatestSnapshot();
    res.json({ success: true, snapshot });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve latest snapshot' });
  }
});

app.get('/api/ai-bot/snapshots', (req, res) => {
  try {
    const snapshots = globalAiSnapshotStore.getAllSnapshots();
    res.json({ success: true, snapshots, count: snapshots.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve snapshots' });
  }
});

// All Matches filtered for requested date (or today in Africa/Kampala by default)
app.get('/api/all-matches', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const todayDateStr = getKampalaTodayDateStr();
  const queryDate = req.query.date as string | undefined;
  const targetDateStr = queryDate || todayDateStr;
  const forceRefresh = req.query.refresh === 'true';

  try {
    const liveMatches = await globalLiveScoreboard.fetchRealLiveMatches(targetDateStr, forceRefresh);
    if (liveMatches && liveMatches.length > 0) {
      globalMatchStore.upsertMatches(liveMatches);
      return res.json(liveMatches);
    }
  } catch (err) {
    console.warn('[Vercel API Router] Live fetch notice:', err);
  }

  // Non-blocking automation pass
  globalAutomationEngine.runAutomationCycle().catch(() => {});

  const matches = globalMatchStore.getMatchesForDate(targetDateStr);
  res.json(matches);
});

// Explicit Matches by Date endpoint
app.get('/api/matches/date/:dateStr', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const dateStr = req.params.dateStr;
  const forceRefresh = req.query.refresh === 'true';

  try {
    const liveMatches = await globalLiveScoreboard.fetchRealLiveMatches(dateStr, forceRefresh);
    if (liveMatches && liveMatches.length > 0) {
      globalMatchStore.upsertMatches(liveMatches);
      return res.json(liveMatches);
    }
  } catch (err) {
    console.warn('[Vercel API Router] Date fetch notice:', err);
  }

  const matches = globalMatchStore.getMatchesForDate(dateStr);
  res.json(matches);
});

export default (req: any, res: any) => {
  return app(req, res);
};

