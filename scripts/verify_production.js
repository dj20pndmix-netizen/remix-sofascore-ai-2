import axios from 'axios';

const BASE_URL = process.env.TARGET_URL || 'https://sofascore-ai-predictpro.vercel.app';

async function verifyProduction() {
  console.log('====================================================');
  console.log(`🌐 VERIFYING PRODUCTION DEPLOYMENT: ${BASE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } else {
      console.error(`❌ [FAIL] ${name} ${details}`);
    }
  }

  try {
    // 1. Health
    const health = await axios.get(`${BASE_URL}/api/health`);
    assert(health.status === 200, 'Health check returns HTTP 200');
    assert(health.data.timezone === 'Africa/Kampala', `Timezone is Africa/Kampala (${health.data.timezone})`);
    console.log(`   Timezone: ${health.data.timezone}, Today: ${health.data.todayDate}`);

    // 2. All matches
    const matches = await axios.get(`${BASE_URL}/api/all-matches`);
    assert(matches.status === 200 && Array.isArray(matches.data), 'All matches returns HTTP 200 array');
    console.log(`   Scraped real matches today: ${matches.data?.length || 0}`);
    if (matches.data?.[0]) {
      console.log(`   Sample: ${matches.data[0].homeTeam?.name} vs ${matches.data[0].awayTeam?.name} (${matches.data[0].competition})`);
    }

    // 3. Guest Login
    const guest = await axios.post(`${BASE_URL}/api/auth/guest-login`);
    assert(guest.status === 200 && Boolean(guest.data?.session?.token), 'Guest login succeeds');

    // 4. Admin Login
    const admin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'dj20pndmix@gmail.com',
      password: 'admin123'
    });
    const token = admin.data?.session?.token;
    assert(admin.status === 200 && Boolean(token), 'Admin login succeeds');

    // 5. Protected Admin Metrics
    const metrics = await axios.get(`${BASE_URL}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(metrics.status === 200 && metrics.data.success, 'Admin metrics accessible');

    // 6. Automation Status
    const auto = await axios.get(`${BASE_URL}/api/automation/status`);
    assert(auto.status === 200, 'Automation status accessible');

    // 7. Prediction History Stats
    const history = await axios.get(`${BASE_URL}/api/history/stats`);
    assert(history.status === 200, 'Prediction history stats endpoint returns HTTP 200');
    console.log(`   History records: ${history.data?.totalSettled}, Win Rate: ${history.data?.winRate}%`);

    // 8. Verification Suite
    const verify = await axios.get(`${BASE_URL}/api/verification/run-tests`);
    assert(verify.status === 200 && verify.data.passed === verify.data.total, `Internal verification passed (${verify.data?.passed}/${verify.data?.total})`);

    console.log('\n====================================================');
    console.log(`🎉 PRODUCTION HEALTH SCORE: ${passed}/${total} (${((passed / total) * 100).toFixed(0)}%)`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Error during verification:', err?.response?.data || err.message);
  }
}

verifyProduction();
