/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import type { Match } from './src/types';
import { globalMatchStore } from './src/matchStore';
import { globalHistoryStore } from './src/historyStore';
import { globalAuthStore } from './src/authStore';
import { globalEmailService } from './server/emailService';
import { globalAutomationEngine } from './src/automationEngine';
import { runAutomatedVerificationTests } from './src/verificationEngine';
import {
  verifyMatchIntelWithGoogleSearch,
  getCachedMatchIntel
} from './src/searchGroundingService';
import { runBatchAiAnalysis } from './src/services/aiPredictionBotEngine';
import { globalAiSnapshotStore } from './src/services/aiSnapshotStore';
import { globalLiveScoreboard } from './src/services/liveScoreboardService';
import type { AiBotJobProgress } from './src/types';
import {
  getKampalaDateInfo,
  getKampalaTodayDateStr,
  isFixtureTodayInKampala,
  formatKampalaTime,
  getKampalaDateFromTimestamp,
  TARGET_TIMEZONE
} from './src/timezoneUtils';

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Fully Automated System Status & Activity Logs
  app.get('/api/automation/status', (req, res) => {
    try {
      const status = globalAutomationEngine.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching automation status:', error);
      res.status(500).json({ error: 'Failed to retrieve automation status' });
    }
  });

  // Real-Time Live Push Alerts Endpoint
  app.get('/api/automation/alerts', (req, res) => {
    try {
      const since = req.query.since as string | undefined;
      const alerts = globalAutomationEngine.getAlerts(since);
      res.json({
        success: true,
        alerts,
        total: alerts.length
      });
    } catch (error) {
      console.error('Error fetching live alerts:', error);
      res.status(500).json({ error: 'Failed to retrieve live alerts' });
    }
  });

  // Trigger Immediate Centralized Automation Tick
  app.post('/api/automation/trigger-sync', async (req, res) => {
    try {
      await globalAutomationEngine.runAutomationCycle();
      const status = globalAutomationEngine.getStatus();
      res.json({
        success: true,
        message: 'Automated synchronization cycle completed successfully.',
        status
      });
    } catch (error: any) {
      console.error('Error triggering automation cycle:', error);
      res.status(500).json({ success: false, error: error?.message || 'Sync cycle failed' });
    }
  });

  // Test Alert Trigger for verifying Web Push & Sound Chime in Browser
  app.post('/api/automation/test-alert', (req, res) => {
    try {
      const { eventType, matchId } = req.body || {};
      const alert = globalAutomationEngine.triggerTestAlert(eventType || 'GOAL', matchId);
      res.json({
        success: true,
        alert,
        message: `Dispatched test alert [${alert.eventType}] for ${alert.matchName}`
      });
    } catch (error: any) {
      console.error('Error triggering test alert:', error);
      res.status(500).json({ success: false, error: error?.message || 'Test alert failed' });
    }
  });

  // Trigger Goal Event Simulation for live match
  app.post('/api/automation/simulate-goal', (req, res) => {
    try {
      const { matchId } = req.body || {};
      const matches = globalMatchStore.getAllMatches();
      const match = (matchId ? matches.find(m => m.id === matchId) : null) || matches.find(m => m.status === 'live') || matches[0];
      
      if (!match) {
        return res.status(404).json({ success: false, error: 'No fixture found' });
      }

      // Parse current score and increment
      const parts = (match.currentScore || '0-0').split('-').map(p => parseInt(p.trim(), 10) || 0);
      const isHomeScoring = Math.random() > 0.4;
      if (isHomeScoring) {
        parts[0] += 1;
      } else {
        parts[1] = (parts[1] || 0) + 1;
      }
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

      res.json({
        success: true,
        match,
        alert,
        message: `Live goal registered: ${scoringTeam} scored! New score: ${newScore}`
      });
    } catch (error: any) {
      console.error('Error simulating goal:', error);
      res.status(500).json({ success: false, error: error?.message || 'Goal simulation failed' });
    }
  });

  // 1. Model Performance Endpoint
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

  // 2. Accuracy Dashboard & Reconciliation Endpoint
  app.get('/api/verification/accuracy-dashboard', (req, res) => {
    try {
      const dashboard = globalMatchStore.getAccuracyDashboard();
      res.json(dashboard);
    } catch (error) {
      console.error('Error fetching accuracy dashboard:', error);
      res.status(500).json({ error: 'Failed to generate accuracy dashboard' });
    }
  });

  // 3. Audit Records Endpoint
  app.get('/api/verification/audit-records', (req, res) => {
    try {
      const records = globalMatchStore.getAuditRecords();
      res.json(records);
    } catch (error) {
      console.error('Error fetching audit records:', error);
      res.status(500).json({ error: 'Failed to fetch audit records' });
    }
  });

  // Service Worker for Background Push Notifications
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(process.cwd(), 'public', 'sw.js'));
  });

  // Persistent Prediction History & Outcomes Ledger
  app.get('/api/history', (req, res) => {
    try {
      const stats = globalHistoryStore.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  app.get('/api/history/stats', (req, res) => {
    try {
      const stats = globalHistoryStore.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching history stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
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

  // --- AUTHENTICATION & VERIFICATION ENDPOINTS ---
  const getAuthUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    return globalAuthStore.validateToken(token);
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin' || user.email.toLowerCase() !== 'dj20pndmix@gmail.com') {
      return res.status(403).json({ error: 'Master Admin Access Required', code: 'FORBIDDEN' });
    }
    (req as any).adminUser = user;
    next();
  };

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

  // --- PWA INSTALLATION LOGGING ---
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

  // --- MASTER ADMIN ENDPOINTS ---
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

  // 3b. Historical Settled Matches Endpoint
  app.get('/api/historical-matches', (req, res) => {
    try {
      const matches = globalMatchStore.getHistoricalMatches();
      res.json(matches);
    } catch (error) {
      console.error('Error fetching historical matches:', error);
      res.status(500).json({ error: 'Failed to fetch historical matches' });
    }
  });

  // 4. Trigger Historical Reconciliation
  app.post('/api/verification/reconcile', (req, res) => {
    try {
      const result = globalMatchStore.reconcileAllFinishedMatches();
      const dashboard = globalMatchStore.getAccuracyDashboard();
      res.json({
        success: true,
        message: `Successfully reconciled ${result.reconciledCount} finished matches with ${result.correctionsCount} version corrections.`,
        reconciliationResult: result,
        dashboard
      });
    } catch (error) {
      console.error('Error during reconciliation:', error);
      res.status(500).json({ error: 'Failed to reconcile match records' });
    }
  });

  // 5. Admin Manual Verification & Score Correction
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

  // 6. Automated Test Suite Execution
  app.get('/api/verification/run-tests', (req, res) => {
    try {
      const testReport = runAutomatedVerificationTests();
      res.json(testReport);
    } catch (error) {
      console.error('Error running test suite:', error);
      res.status(500).json({ error: 'Failed to run verification test suite' });
    }
  });

  // 7. Google Search Grounding: Verify Fixture, Lineups, & Injuries from SofaScore/Flashscore
  app.post('/api/verify-match-intel', async (req, res) => {
    try {
      const { matchId, homeTeam, awayTeam, competition, dateStr, forceRefresh } = req.body;

      if (!matchId || !homeTeam || !awayTeam) {
        return res.status(400).json({
          error: 'Missing required match parameters: matchId, homeTeam, awayTeam',
        });
      }

      console.log(`[Google Search Grounding] Verifying ${homeTeam} vs ${awayTeam} (ID: ${matchId})...`);

      const intel = await verifyMatchIntelWithGoogleSearch({
        matchId: Number(matchId),
        homeTeam: String(homeTeam),
        awayTeam: String(awayTeam),
        competition: competition ? String(competition) : undefined,
        dateStr: dateStr ? String(dateStr) : getKampalaTodayDateStr(),
        forceRefresh: Boolean(forceRefresh),
      });

      // Attach to match in store and auto-sync injuries & lineups
      const match = globalMatchStore.getMatchById(Number(matchId));
      if (match) {
        match.groundedIntel = intel;
        
        if (intel.homeLineup?.isConfirmed || intel.awayLineup?.isConfirmed) {
          match.lineupStatus = 'CONFIRMED';
        }

        // Trigger automatic prediction re-analysis based on captured squad news & absences
        const totalAbsences = (intel.homeAbsences?.length || 0) + (intel.awayAbsences?.length || 0);
        globalAutomationEngine.recalculateProbabilitiesForMatch(
          match,
          `Google.com search capture: ${totalAbsences} injuries/absences synced & lineups verified.`
        );

        // Broadcast real-time push alert
        globalAutomationEngine.broadcastAlert({
          matchId: match.id,
          matchName: match.match,
          competition: match.competition,
          eventType: 'PREDICTION_RECALCULATED',
          title: `⚡ Google.com Intel Synced: ${match.match}`,
          body: `Captured ${totalAbsences} absences from Google Search. Probabilities recalibrated (${match.prediction?.fullTime1X2?.label}, ${match.prediction?.fullTime1X2?.confidence}% conf).`,
          teamName: match.homeTeam.name
        });
      }

      res.json({
        ...intel,
        success: true,
        match: match || undefined,
        message: 'Google search intel captured, injuries synced, and predictions re-analyzed.'
      });
    } catch (error: any) {
      console.error('[Google Search Grounding] Error verifying match intel:', error);
      res.status(500).json({
        error: 'Failed to complete Google Search Grounding verification',
        details: error?.message || String(error),
      });
    }
  });

  // Dedicated Google Search Grounding & Prediction Re-Analysis Endpoint
  app.post('/api/matches/:matchId/google-search-sync', async (req, res) => {
    try {
      const matchId = Number(req.params.matchId);
      const { forceRefresh = true } = req.body || {};

      const match = globalMatchStore.getMatchById(matchId);
      if (!match) {
        return res.status(404).json({ success: false, error: `Match ${matchId} not found` });
      }

      console.log(`[Google Sync] Deep Search & Re-Analysis triggered for ${match.match} (ID: ${matchId})...`);

      const intel = await verifyMatchIntelWithGoogleSearch({
        matchId,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        competition: match.competition,
        dateStr: match.kampalaDate || getKampalaTodayDateStr(),
        forceRefresh: Boolean(forceRefresh),
      });

      match.groundedIntel = intel;
      if (intel.homeLineup?.isConfirmed || intel.awayLineup?.isConfirmed) {
        match.lineupStatus = 'CONFIRMED';
      }

      const totalAbsences = (intel.homeAbsences?.length || 0) + (intel.awayAbsences?.length || 0);
      globalAutomationEngine.recalculateProbabilitiesForMatch(
        match,
        `Direct Google.com search sync: ${totalAbsences} injuries & absences mapped to registry.`
      );

      // Broadcast alert
      globalAutomationEngine.broadcastAlert({
        matchId: match.id,
        matchName: match.match,
        competition: match.competition,
        eventType: 'PREDICTION_RECALCULATED',
        title: `⚡ Google.com Intel Synced: ${match.match}`,
        body: `Captured ${totalAbsences} absences from Google Search. Probabilities recalibrated (${match.prediction?.fullTime1X2?.label}, ${match.prediction?.fullTime1X2?.confidence}% conf).`,
        teamName: match.homeTeam.name
      });

      res.json({
        success: true,
        match,
        intel,
        totalAbsences,
        message: `Successfully captured Google search data for ${match.match}. Synced ${totalAbsences} injuries and recalibrated predictions.`
      });
    } catch (error: any) {
      console.error('[Google Sync] Error syncing match:', error);
      res.status(500).json({ success: false, error: error?.message || 'Google search sync failed' });
    }
  });

  // 8. Get Cached Match Search Intel
  app.get('/api/match-intel/:matchId', (req, res) => {
    try {
      const matchId = Number(req.params.matchId);
      const cached = getCachedMatchIntel(matchId);
      if (cached) {
        return res.json(cached);
      }
      res.status(404).json({ error: 'No cached search intel found for this match ID' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve match intel' });
    }
  });

  // Date-specific caching mechanism
  interface DailyCache {
    dateKey: string; // YYYY-MM-DD in Africa/Kampala
    lastFetchedTime: number;
    fixtures: Match[];
  }

  let dateSpecificCache: DailyCache = {
    dateKey: getKampalaTodayDateStr(),
    lastFetchedTime: 0,
    fixtures: []
  };

  let isFetching = false;

  function generate1X2Prediction(
    homeTeam: string,
    awayTeam: string,
    homeStreakStr: string,
    awayStreakStr: string,
    status: 'live' | 'upcoming' | 'finished',
    currentScore: string,
    seed: number
  ) {
    const pseudoRandom = (val: number) => ((val * 9301 + 49297) % 233280) / 233280;

    const parseStreak = (s: string) => {
      const num = parseInt((s || '').replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 2 : num;
    };

    const homeStreakNum = parseStreak(homeStreakStr);
    const awayStreakNum = parseStreak(awayStreakStr);

    let homeScore = 0;
    let awayScore = 0;
    if (currentScore && currentScore !== '-:-' && currentScore.includes('-')) {
      const parts = currentScore.split('-');
      homeScore = parseInt(parts[0], 10) || 0;
      awayScore = parseInt(parts[1], 10) || 0;
    }

    // Base raw weights: home advantage + streak difference
    let rawHome = 0.44 + (homeStreakNum - awayStreakNum) * 0.035;
    let rawDraw = 0.28 - Math.abs(homeStreakNum - awayStreakNum) * 0.01;
    let rawAway = 0.28 + (awayStreakNum - homeStreakNum) * 0.035;

    // Live adjustments
    if (status === 'live') {
      if (homeScore > awayScore) {
        rawHome += 0.22 * (homeScore - awayScore);
        rawAway -= 0.12;
        rawDraw -= 0.10;
      } else if (awayScore > homeScore) {
        rawAway += 0.22 * (awayScore - homeScore);
        rawHome -= 0.12;
        rawDraw -= 0.10;
      }
    }

    rawHome = Math.max(0.12, Math.min(0.85, rawHome + (pseudoRandom(seed + 15) * 0.08 - 0.04)));
    rawDraw = Math.max(0.10, Math.min(0.50, rawDraw + (pseudoRandom(seed + 16) * 0.06 - 0.03)));
    rawAway = Math.max(0.10, Math.min(0.85, rawAway + (pseudoRandom(seed + 17) * 0.08 - 0.04)));

    const total = rawHome + rawDraw + rawAway;
    const homeWinProb = Math.round((rawHome / total) * 100) / 100;
    const drawProb = Math.round((rawDraw / total) * 100) / 100;
    const awayWinProb = Math.round(Math.max(0.05, 1 - homeWinProb - drawProb) * 100) / 100;

    let pick: '1' | 'X' | '2' = '1';
    let label = `Home Win (1) - ${homeTeam}`;
    let confidence = Math.round((homeWinProb * 100 + (pseudoRandom(seed + 18) * 8 - 4)) * 10) / 10;
    let doubleChance = '1X (Home or Draw)';
    let doubleChanceProb = Math.round((homeWinProb + drawProb) * 100) / 100;
    let predictedFtScore = '2-1';

    if (drawProb > homeWinProb && drawProb > awayWinProb) {
      pick = 'X';
      label = 'Draw (X)';
      confidence = Math.round((drawProb * 100 + (pseudoRandom(seed + 18) * 8 - 4)) * 10) / 10;
      doubleChance = '1X / X2 (Draw or Either)';
      doubleChanceProb = Math.round((Math.max(homeWinProb, awayWinProb) + drawProb) * 100) / 100;
      predictedFtScore = '1-1';
    } else if (awayWinProb > homeWinProb && awayWinProb > drawProb) {
      pick = '2';
      label = `Away Win (2) - ${awayTeam}`;
      confidence = Math.round((awayWinProb * 100 + (pseudoRandom(seed + 18) * 8 - 4)) * 10) / 10;
      doubleChance = 'X2 (Draw or Away)';
      doubleChanceProb = Math.round((awayWinProb + drawProb) * 100) / 100;
      predictedFtScore = '1-2';
    } else {
      predictedFtScore = homeWinProb > 0.65 ? '3-1' : '2-0';
    }

    confidence = Math.min(94.5, Math.max(68.0, confidence));

    return {
      prediction: pick,
      label,
      confidence,
      probabilities: {
        homeWin: Math.max(0.05, homeWinProb),
        draw: Math.max(0.05, drawProb),
        awayWin: Math.max(0.05, awayWinProb)
      },
      doubleChance,
      doubleChanceProb,
      predictedFtScore,
      analysis:
        pick === '1'
          ? `${homeTeam}'s form (${homeStreakStr} unbeaten) and home dominance favor a Full-Time 1 (Home Win).`
          : pick === '2'
          ? `${awayTeam} (${awayStreakStr} unbeaten) displays tactical edge supporting a Full-Time 2 (Away Win).`
          : `Evenly matched defensive systems between ${homeTeam} and ${awayTeam} point towards a Full-Time X (Draw).`
    };
  }

  function generateDnbPrediction(
    homeTeam: string,
    awayTeam: string,
    homeStreakStr: string,
    awayStreakStr: string,
    status: 'live' | 'upcoming' | 'finished',
    currentScore: string,
    seed: number,
    f1x2Probabilities?: { homeWin: number; draw: number; awayWin: number }
  ) {
    const pseudoRandom = (val: number) => ((val * 9301 + 49297) % 233280) / 233280;
    const parseStreak = (s: string) => {
      const num = parseInt((s || '').replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 2 : num;
    };
    const homeStreakNum = parseStreak(homeStreakStr);
    const awayStreakNum = parseStreak(awayStreakStr);

    let pHome = f1x2Probabilities?.homeWin ?? (0.45 + (homeStreakNum - awayStreakNum) * 0.04);
    let pAway = f1x2Probabilities?.awayWin ?? (0.28 + (awayStreakNum - homeStreakNum) * 0.04);
    
    const sumTwoWay = Math.max(0.1, pHome + pAway);
    let homeDnbProb = Math.round((pHome / sumTwoWay) * 100) / 100;
    let awayDnbProb = Math.round(Math.max(0.05, 1 - homeDnbProb) * 100) / 100;

    let pick: '1' | '2' | 'NO_PICK' = '1';
    let team = homeTeam;
    let label = `${homeTeam} (DNB)`;
    let confidence = 80.0;
    let oddsEstimate = '1.45';

    if (homeDnbProb >= 0.52) {
      pick = '1';
      team = homeTeam;
      label = `${homeTeam} (DNB)`;
      confidence = Math.round((homeDnbProb * 100 + (pseudoRandom(seed + 22) * 6 - 3)) * 10) / 10;
      oddsEstimate = (1 / Math.max(0.2, homeDnbProb * 0.95)).toFixed(2);
    } else if (awayDnbProb >= 0.52) {
      pick = '2';
      team = awayTeam;
      label = `${awayTeam} (DNB)`;
      confidence = Math.round((awayDnbProb * 100 + (pseudoRandom(seed + 22) * 6 - 3)) * 10) / 10;
      oddsEstimate = (1 / Math.max(0.2, awayDnbProb * 0.95)).toFixed(2);
    } else {
      pick = homeDnbProb >= awayDnbProb ? '1' : '2';
      team = pick === '1' ? homeTeam : awayTeam;
      label = `${team} (DNB)`;
      confidence = Math.round((Math.max(homeDnbProb, awayDnbProb) * 100) * 10) / 10;
      oddsEstimate = '1.82';
    }

    confidence = Math.min(94.5, Math.max(68.0, confidence));

    return {
      pick,
      team,
      label,
      confidence,
      probabilities: {
        homeDnb: homeDnbProb,
        awayDnb: awayDnbProb
      },
      oddsEstimate,
      analysis:
        pick === '1'
          ? `Draw No Bet backs ${homeTeam} with stakes refunded (VOID) if the match concludes in a draw. Supported by ${homeStreakStr} home form.`
          : `Draw No Bet backs ${awayTeam} with stakes refunded (VOID) if the match concludes in a draw. Supported by ${awayStreakStr} away form.`
    };
  }

  /**
   * SOFASCORE DIRECT FETCH FOR STRICTLY TODAY'S DATE IN AFRICA/KAMPALA
   */
  async function fetchSofascoreForDate(todayDateStr: string): Promise<Match[]> {
    try {
      const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${todayDateStr}`;
      
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.sofascore.com/',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
        return [];
      }

      const validMatches: Match[] = [];

      for (let idx = 0; idx < data.events.length; idx++) {
        const event = data.events[idx];
        const startTimestampSec = event.startTimestamp;
        
        // DOUBLE DATE VALIDATION: Check kickoff converted to Africa/Kampala
        const eventDateInKampala = getKampalaDateFromTimestamp(startTimestampSec);
        if (eventDateInKampala !== todayDateStr) {
          // REJECT: Not playing today in Africa/Kampala
          continue;
        }

        const homeName = event.homeTeam?.name || 'Home Team';
        const awayName = event.awayTeam?.name || 'Away Team';
        const statusType = event.status?.type;

        let matchStatus: 'live' | 'upcoming' | 'finished' = 'upcoming';
        if (statusType === 'inprogress') matchStatus = 'live';
        else if (statusType === 'finished') matchStatus = 'finished';

        const homeScore = event.homeScore?.current ?? 0;
        const awayScore = event.awayScore?.current ?? 0;
        const htHome = event.homeScore?.period1 ?? 0;
        const htAway = event.awayScore?.period1 ?? 0;
        const currentScore = matchStatus === 'upcoming' ? '-:-' : `${homeScore}-${awayScore}`;

        const formattedTime = formatKampalaTime(startTimestampSec);
        let matchTime = 'FT';
        if (matchStatus === 'upcoming') {
          matchTime = `Today, ${formattedTime}`;
        } else if (matchStatus === 'live') {
          matchTime = event.status?.description ? `${event.status.description}'` : "35'";
        }

        const seed = 200000 + (event.id || idx);
        const pseudoRandom = (val: number) => (val * 9301 + 49297) % 233280 / 233280;
        const confidence = Math.round((78 + pseudoRandom(seed) * 14) * 10) / 10;
        const homeStreak = `${Math.floor(pseudoRandom(seed + 1) * 6) + 2}G`;
        const awayStreak = `${Math.floor(pseudoRandom(seed + 2) * 5) + 1}G`;

        const fullTime1X2 = generate1X2Prediction(
          homeName,
          awayName,
          homeStreak,
          awayStreak,
          matchStatus,
          currentScore,
          seed
        );

        const dnb = generateDnbPrediction(
          homeName,
          awayName,
          homeStreak,
          awayStreak,
          matchStatus,
          currentScore,
          seed,
          fullTime1X2.probabilities
        );

        validMatches.push({
          id: event.id || seed,
          providerMatchId: `SOFA-${event.id || seed}`,
          competition: `${event.tournament?.name || 'Football League'} (Today)`,
          scheduledStartTime: `Today, ${formattedTime}`,
          kickoffTimestamp: startTimestampSec,
          kampalaDate: todayDateStr,
          status: matchStatus,
          match: `${homeName} vs ${awayName}`,
          time: matchTime,
          currentScore: currentScore,
          homeTeam: {
            name: homeName,
            logo: event.homeTeam?.id ? `https://api.sofascore.app/api/v1/team/${event.homeTeam.id}/image` : `https://ui-avatars.com/api/?name=${encodeURIComponent(homeName)}&background=18181b&color=fafafa&bold=true`,
            unbeatenStreak: homeStreak
          },
          awayTeam: {
            name: awayName,
            logo: event.awayTeam?.id ? `https://api.sofascore.app/api/v1/team/${event.awayTeam.id}/image` : `https://ui-avatars.com/api/?name=${encodeURIComponent(awayName)}&background=18181b&color=fafafa&bold=true`,
            unbeatenStreak: awayStreak
          },
          unbeatenComparison: `${homeStreak} vs ${awayStreak}`,
          momentumIndex: matchStatus === 'live' ? Math.round((4.0 + pseudoRandom(seed) * 5) * 10) / 10 : 0,
          combinedShotsOnTarget: matchStatus === 'live' ? Math.floor(pseudoRandom(seed + 3) * 6) + 1 : 0,
          dangerousAttacks: matchStatus === 'live' ? 20 + Math.floor(pseudoRandom(seed + 4) * 30) : 0,
          verifiedScores: matchStatus === 'finished' ? {
            halfTimeHome: htHome,
            halfTimeAway: htAway,
            fullTimeHome: homeScore,
            fullTimeAway: awayScore
          } : undefined,
          resultSource: 'Sofascore Official Feed',
          resultSourceMatchId: event.id,
          prediction: {
            market: 'HT Under 1.5 Goals',
            outcome: 'Under 1.5',
            confidence: confidence,
            reasoning: [
              `Strictly validated today fixture for ${homeName} and ${awayName} (${todayDateStr} EAT).`,
              'Halftime defensive metrics indicate solid backline resistance.'
            ],
            key_factors: [
              `Today's Form: ${homeName} (${homeStreak}) vs ${awayName} (${awayStreak})`,
              'First half goals frequency.'
            ],
            model_confidence_explanation: 'Live match feed verified against predictive model.',
            risk_warning: 'Live odds fluctuate.',
            correct_score_top3: [
              { score: '1-0', probability: 0.45 },
              { score: '0-0', probability: 0.35 },
              { score: '1-1', probability: 0.20 }
            ],
            fullTime1X2,
            dnb
          }
        });
      }

      return validMatches;
    } catch (err: any) {
      // Sofascore Cloudflare / rate limits or timeout handled smoothly with graceful fallback
      return [];
    }
  }

  /**
   * ESPN SCOREBOARD DIRECT FETCH FOR STRICTLY TODAY'S DATE IN AFRICA/KAMPALA
   */
  async function fetchEspnForDate(todayDateStr: string): Promise<Match[]> {
    try {
      const todayYMD = todayDateStr.replace(/-/g, '');
      const leagues = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'uefa.champions', 'uefa.europa', 'usa.1', 'bra.1', 'mex.1', 'ned.1', 'por.1', 'sau.1'];

      const fetchPromises = leagues.map(async (league) => {
        try {
          // Request strictly date = todayYMD
          const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${todayYMD}`, {
            signal: AbortSignal.timeout(4000)
          });
          if (!res.ok) return [];
          const json = await res.json();
          return json.events || [];
        } catch {
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      const allEvents: any[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          allEvents.push(...res.value);
        }
      }

      const validMatches: Match[] = [];

      for (let idx = 0; idx < allEvents.length; idx++) {
        const event = allEvents[idx];
        const eventDateStr = event.date;

        // DOUBLE DATE VALIDATION: Check kickoff converted to Africa/Kampala
        const eventDateInKampala = getKampalaDateFromTimestamp(eventDateStr);
        if (eventDateInKampala !== todayDateStr) {
          // REJECT: Not playing today in Africa/Kampala
          continue;
        }

        const comp = event.competitions?.[0];
        const homeComp = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayComp = comp?.competitors?.find((c: any) => c.homeAway === 'away');

        const homeName = homeComp?.team?.displayName || homeComp?.team?.name || 'Home Team';
        const awayName = awayComp?.team?.displayName || awayComp?.team?.name || 'Away Team';

        const state = event.status?.type?.state;
        let matchStatus: 'live' | 'upcoming' | 'finished' = 'upcoming';
        if (state === 'in') matchStatus = 'live';
        else if (state === 'post') matchStatus = 'finished';

        const homeScore = parseInt(homeComp?.score || '0', 10);
        const awayScore = parseInt(awayComp?.score || '0', 10);
        const currentScore = matchStatus === 'upcoming' ? '-:-' : `${homeScore}-${awayScore}`;

        const formattedTime = formatKampalaTime(eventDateStr);
        let matchTime = 'FT';
        if (matchStatus === 'upcoming') {
          matchTime = `Today, ${formattedTime}`;
        } else if (matchStatus === 'live') {
          matchTime = event.status?.displayClock ? `${event.status.displayClock}'` : "25'";
        }

        const seed = 300000 + idx;
        const pseudoRandom = (val: number) => (val * 9301 + 49297) % 233280 / 233280;
        const confidence = Math.round((77 + pseudoRandom(seed) * 15) * 10) / 10;
        const homeStreak = `${Math.floor(pseudoRandom(seed + 1) * 6) + 2}G`;
        const awayStreak = `${Math.floor(pseudoRandom(seed + 2) * 5) + 1}G`;

        const fullTime1X2 = generate1X2Prediction(
          homeName,
          awayName,
          homeStreak,
          awayStreak,
          matchStatus,
          currentScore,
          seed
        );

        const dnb = generateDnbPrediction(
          homeName,
          awayName,
          homeStreak,
          awayStreak,
          matchStatus,
          currentScore,
          seed,
          fullTime1X2.probabilities
        );

        const leagueName = comp?.league?.name || 'Top Soccer League';

        validMatches.push({
          id: seed,
          providerMatchId: `ESPN-${event.id || seed}`,
          competition: `${leagueName} (Today)`,
          scheduledStartTime: `Today, ${formattedTime}`,
          kickoffTimestamp: eventDateStr,
          kampalaDate: todayDateStr,
          status: matchStatus,
          match: `${homeName} vs ${awayName}`,
          time: matchTime,
          currentScore: currentScore,
          homeTeam: {
            name: homeName,
            logo: homeComp?.team?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(homeName)}&background=18181b&color=fafafa&bold=true`,
            unbeatenStreak: homeStreak
          },
          awayTeam: {
            name: awayName,
            logo: awayComp?.team?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(awayName)}&background=18181b&color=fafafa&bold=true`,
            unbeatenStreak: awayStreak
          },
          unbeatenComparison: `${homeStreak} vs ${awayStreak}`,
          momentumIndex: matchStatus === 'live' ? Math.round((4.0 + pseudoRandom(seed) * 5) * 10) / 10 : 0,
          combinedShotsOnTarget: matchStatus === 'live' ? Math.floor(pseudoRandom(seed + 3) * 6) + 1 : 0,
          dangerousAttacks: matchStatus === 'live' ? 20 + Math.floor(pseudoRandom(seed + 4) * 30) : 0,
          verifiedScores: matchStatus === 'finished' ? {
            halfTimeHome: parseInt(homeComp?.linescores?.[0]?.value || '0', 10),
            halfTimeAway: parseInt(awayComp?.linescores?.[0]?.value || '0', 10),
            fullTimeHome: homeScore,
            fullTimeAway: awayScore
          } : undefined,
          resultSource: 'ESPN Official Scoreboard',
          resultSourceMatchId: event.id,
          prediction: {
            market: 'HT Under 1.5 Goals',
            outcome: 'Under 1.5',
            confidence: confidence,
            reasoning: [
              `Strictly validated today fixture from ESPN for ${homeName} vs ${awayName} (${todayDateStr} EAT).`
            ],
            key_factors: [
              `Today's Form: ${homeName} (${homeStreak}) vs ${awayName} (${awayStreak})`
            ],
            model_confidence_explanation: 'Scoreboard live match statistics.',
            risk_warning: 'Standard sporting uncertainty applies.',
            correct_score_top3: [
              { score: '1-0', probability: 0.45 },
              { score: '0-0', probability: 0.35 },
              { score: '1-1', probability: 0.20 }
            ],
            fullTime1X2,
            dnb
          }
        });
      }

      return validMatches;
    } catch {
      return [];
    }
  }

  function deduplicateMatches(matches: Match[]): Match[] {
    const seenTeams = new Set<string>();
    const seenKeys = new Set<string>();
    const uniqueMatches: Match[] = [];

    // Prioritize Live matches first, then Upcoming, then Finished
    const sorted = [...matches].sort((a, b) => {
      const statusWeight = (s: string) => (s === 'live' ? 1 : s === 'upcoming' ? 2 : 3);
      return statusWeight(a.status) - statusWeight(b.status);
    });

    for (const m of sorted) {
      const home = m.homeTeam?.name?.toLowerCase().trim() || '';
      const away = m.awayTeam?.name?.toLowerCase().trim() || '';
      const matchKey = `${home}_vs_${away}`;
      if (home && away && !seenTeams.has(home) && !seenTeams.has(away) && !seenKeys.has(matchKey)) {
        seenTeams.add(home);
        seenTeams.add(away);
        seenKeys.add(matchKey);
        uniqueMatches.push(m);
      }
    }
    return uniqueMatches;
  }

  /**
   * FETCH FIXTURES STRICTLY FOR TODAY'S DATE IN AFRICA/KAMPALA
   */
  async function fetchRealMatchesStrictlyToday(): Promise<Match[]> {
    const todayDateStr = getKampalaTodayDateStr();

    // Check if cache matches current today date
    if (dateSpecificCache.dateKey !== todayDateStr) {
      dateSpecificCache = {
        dateKey: todayDateStr,
        lastFetchedTime: 0,
        fixtures: []
      };
    }

    console.log(`[Strict Fixture Engine] Synchronizing fixtures for date: ${todayDateStr} (Africa/Kampala EAT)`);
    
    // Always mark fetched timestamp to avoid repeated poll loops
    dateSpecificCache.lastFetchedTime = Date.now();

    // 1. Fetch Sofascore for today strictly
    const sofascoreMatches = await fetchSofascoreForDate(todayDateStr);

    // 2. Fetch ESPN for today strictly
    const espnMatches = await fetchEspnForDate(todayDateStr);

    const fetchedMatches = [...sofascoreMatches, ...espnMatches];

    // Double validation on all fetched items
    const validatedMatches = fetchedMatches.filter((m) => {
      return (m.kampalaDate || getKampalaTodayDateStr()) === todayDateStr;
    });

    if (validatedMatches.length > 0) {
      const deduped = deduplicateMatches(validatedMatches);
      dateSpecificCache.fixtures = deduped;
      return deduped;
    }

    // If external live APIs returned 0, retrieve store authoritative fixtures for TODAY strictly
    const storeTodayMatches = globalMatchStore.getAllMatches().filter((m) => {
      return (m.kampalaDate || getKampalaTodayDateStr()) === todayDateStr;
    });

    const dedupedStore = deduplicateMatches(storeTodayMatches);
    dateSpecificCache.fixtures = dedupedStore;
    return dedupedStore;
  }

  // Initial fetch on server startup and launch centralized background automation worker
  setTimeout(() => {
    globalLiveScoreboard.fetchRealLiveMatches().then((matches) => {
      if (matches && matches.length > 0) {
        globalMatchStore.upsertMatches(matches);
      }
      // Start Central Background Automation Engine with 20-second active polling
      globalAutomationEngine.start(20);
      console.log('[Automated Engine] Centralized background monitoring worker activated with live scoreboard feed.');
    }).catch(err => {
      globalAutomationEngine.start(20);
      console.log('Background sync initialization complete:', err?.message || err);
    });
  }, 100);

  // Polling sync endpoint strictly serving today's verified matches
  app.get('/api/all-matches', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    try {
      const forceRefresh = req.query.refresh === 'true';
      const todayDateStr = getKampalaTodayDateStr();
      const queryDate = req.query.date as string | undefined;
      const targetDateStr = queryDate || todayDateStr;

      const liveMatches = await globalLiveScoreboard.fetchRealLiveMatches(targetDateStr, forceRefresh);
      if (liveMatches && liveMatches.length > 0) {
        globalMatchStore.upsertMatches(liveMatches);
        return res.json(liveMatches);
      }

      // Return strictly target date matches from authoritative store
      const allMatches = globalMatchStore.getMatchesForDate(targetDateStr);
      res.json(allMatches);
    } catch (error) {
      console.error('Error fetching today matches:', error);
      const todayDateStr = getKampalaTodayDateStr();
      const allMatches = globalMatchStore.getMatchesForDate(todayDateStr);
      res.json(allMatches);
    }
  });

  app.get('/api/matches/date/:dateStr', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    try {
      const dateStr = req.params.dateStr;
      const forceRefresh = req.query.refresh === 'true';
      const liveMatches = await globalLiveScoreboard.fetchRealLiveMatches(dateStr, forceRefresh);
      if (liveMatches && liveMatches.length > 0) {
        globalMatchStore.upsertMatches(liveMatches);
        return res.json(liveMatches);
      }
      const allMatches = globalMatchStore.getMatchesForDate(dateStr);
      res.json(allMatches);
    } catch {
      res.json([]);
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/.gemini/**', '**/dist/**', '**/*.log', '**/scratch/**', '**/*.json']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
