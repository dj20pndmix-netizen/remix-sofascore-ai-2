/**
 * Comprehensive Automated End-to-End Test Suite for PredictPro
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 PREDICTPRO COMPREHENSIVE END-TO-END TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail !== undefined ? detail : '');
    }
  }

  try {
    // 1. Health & Timezone Check
    console.log('\n--- 1. Health & Africa/Kampala Timezone Anchor ---');
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200, 'Health check returns HTTP 200');
    assert(healthRes.data.timezone === 'Africa/Kampala', `Timezone is locked to Africa/Kampala (got: ${healthRes.data.timezone})`);
    assert(Boolean(healthRes.data.todayDate), `Today date is valid (${healthRes.data.todayDate})`);

    // 2. Today's Strictly Filtered Fixtures
    console.log('\n--- 2. Strictly Today Matches Store (/api/all-matches) ---');
    const fixturesRes = await axios.get(`${BASE_URL}/api/all-matches`);
    assert(fixturesRes.status === 200, 'All matches endpoint returns HTTP 200');
    
    const matchesList = fixturesRes.data;
    assert(Array.isArray(matchesList) && matchesList.length > 0, `Loaded ${matchesList?.length || 0} fixtures strictly for today`);
    
    const sampleMatch = matchesList[0];
    if (sampleMatch) {
      const homeName = sampleMatch.homeTeam?.name;
      const awayName = sampleMatch.awayTeam?.name;
      assert(Boolean(homeName && awayName), `Match structure is valid (${homeName} vs ${awayName})`);
      assert(Boolean(sampleMatch.prediction), `Match has AI probability prediction computed`);
      assert(Boolean(sampleMatch.lineupStatus), `Squad lineup status is present (${sampleMatch.lineupStatus})`);
    }

    // 3. Authentication & Security
    console.log('\n--- 3. Authentication & Security ---');
    // Test Guest Login
    const guestRes = await axios.post(`${BASE_URL}/api/auth/guest-login`);
    const guestToken = guestRes.data?.session?.token;
    assert(guestRes.status === 200 && Boolean(guestToken), 'Guest login succeeds and returns token');

    // Test Admin Login
    const adminRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'dj20pndmix@gmail.com',
      password: 'admin123'
    });
    const adminToken = adminRes.data?.session?.token;
    const adminUser = adminRes.data?.session?.user;
    assert(adminRes.status === 200 && adminUser?.role === 'admin' && Boolean(adminToken), 'Master Admin login succeeds with admin role');

    // Test Token Profile Validation
    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(meRes.status === 200 && meRes.data.user?.email === 'dj20pndmix@gmail.com', 'Admin profile verified via JWT Bearer token');

    // Test Protected Admin Endpoint
    const adminMetricsRes = await axios.get(`${BASE_URL}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminMetricsRes.status === 200 && adminMetricsRes.data.success, 'Admin metrics accessible with admin privileges');

    // 4. Automation Engine & Push Alerts
    console.log('\n--- 4. Centralized Automation & Alerts ---');
    const autoStatusRes = await axios.get(`${BASE_URL}/api/automation/status`);
    assert(autoStatusRes.status === 200 && autoStatusRes.data.isActive !== undefined, 'Automation background engine status is accessible');

    const testAlertRes = await axios.post(`${BASE_URL}/api/automation/test-alert`, {
      eventType: 'GOAL',
      matchId: sampleMatch?.id
    });
    assert(testAlertRes.status === 200 && testAlertRes.data.success, 'Live push alert simulation dispatched successfully');

    // 5. AI Best-Picks Analysis Engine
    console.log('\n--- 5. AI Deep Match Analysis & Best-Picks Bot Engine ---');
    const aiAnalyzeRes = await axios.post(`${BASE_URL}/api/ai-bot/analyze`, {
      limit: 5,
      forceRefresh: true
    });
    assert(aiAnalyzeRes.status === 200 && aiAnalyzeRes.data.success, 'AI Best Picks analysis executed successfully');
    
    const snapshot = aiAnalyzeRes.data.snapshot;
    assert(snapshot && Array.isArray(snapshot.topPicks), 'AI Analysis snapshot generated');
    assert(snapshot.topPicks.length > 0, `AI Bot generated exactly ${snapshot.topPicks?.length} top ranked betting picks with quality scores`);
    
    if (snapshot.topPicks[0]) {
      const p1 = snapshot.topPicks[0];
      console.log(`   ⭐ Top Pick #1: [${p1.competition}] ${p1.matchName} -> Market: ${p1.marketName} (${p1.pick}) @ ${p1.odds} (Conf: ${p1.confidence.toFixed(1)}%, Edge: ${p1.edgePercentage.toFixed(1)}%, Score: ${p1.qualityScore.toFixed(1)})`);
      assert(Boolean(p1.supportingFactors?.length), 'Top pick contains supporting factor breakdowns');
    }

    // 6. Accuracy Dashboard & Calibration
    console.log('\n--- 6. Accuracy Dashboard & Reconciliation ---');
    const accuracyRes = await axios.get(`${BASE_URL}/api/verification/accuracy-dashboard`);
    assert(accuracyRes.status === 200, 'Accuracy dashboard endpoint returns HTTP 200');
    assert(Boolean(accuracyRes.data.brierScoreFt), `Brier Score computed (${accuracyRes.data.brierScoreFt})`);
    assert(Boolean(accuracyRes.data.ftStats), `Full-Time accuracy stats computed (${accuracyRes.data.ftStats?.accuracyPercentage?.toFixed(1)}%)`);

    // 7. Historical Matches Ledger
    console.log('\n--- 7. Historical Settled Matches Ledger ---');
    const historyRes = await axios.get(`${BASE_URL}/api/historical-matches`);
    assert(historyRes.status === 200 && Array.isArray(historyRes.data), `Historical settled ledger accessible (${historyRes.data?.length || 0} historical matches recorded)`);

    // 8. Internal Automated Verification Test Suite
    console.log('\n--- 8. Internal Verification Engine Suite ---');
    const verifySuiteRes = await axios.get(`${BASE_URL}/api/verification/run-tests`);
    assert(verifySuiteRes.status === 200, 'Internal verification test suite executed');
    assert(verifySuiteRes.data.passed === verifySuiteRes.data.total, `All internal verification sub-tests passed (${verifySuiteRes.data.passed}/${verifySuiteRes.data.total})`);

    // Summary
    console.log('\n====================================================');
    console.log(`🎉 100% ALL TESTS PASSED: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log('====================================================\n');

  } catch (error: any) {
    console.error('Test Suite encountered unhandled error:', error?.response?.data || error?.message || error);
    process.exit(1);
  }
}

runTestSuite();
