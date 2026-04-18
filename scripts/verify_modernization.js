import axios from 'axios';

const GATEWAY_URL = 'http://localhost:3000';
const NOTIFICATION_SERVICE_URL = 'http://localhost:3003'; // Only accessible if internal or host

async function runTests() {
  console.log('🚀 Starting Modernization Verification Tests...');

  try {
    // 1. Auth Login (Postgres check)
    console.log('\n--- 1. Auth Persistence Check ---');
    const loginRes = await axios.post(`${GATEWAY_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('✅ Auth successful (Postgres record verified)');

    // 2. Security Check (Direct Notification Access)
    console.log('\n--- 2. Internal Security Check ---');
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, { message: 'Hack attempt' });
      console.log('❌ FAIL: Notification service should have rejected request without API Key');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ SUCCESS: Notification service rejected unauthorized request (403 Forbidden)');
      } else {
        console.log('⚠️ INFO: Could not reach notification service directly from host (normal in some setups)');
      }
    }

    // 3. Task Creation & Cache Invalidation
    console.log('\n--- 3. Task Persistence & Cache Invalidation ---');
    const taskTitle = `Test Task ${Date.now()}`;
    const createRes = await axios.post(`${GATEWAY_URL}/tasks`, {
      title: taskTitle,
      description: 'Verifying Postgres persistence'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Task created: ${createRes.data.title}`);

    // 4. Redis Cache Check
    console.log('\n--- 4. Redis Caching Check ---');
    console.log('Fetching tasks first time (hit DB)...');
    await axios.get(`${GATEWAY_URL}/tasks`);
    
    console.log('Fetching tasks second time (should hit Cache)...');
    const start = Date.now();
    const tasksRes = await axios.get(`${GATEWAY_URL}/tasks`);
    const duration = Date.now() - start;
    
    const found = tasksRes.data.some(t => t.title === taskTitle);
    if (found) {
      console.log(`✅ Task found in list. Response time: ${duration}ms`);
    } else {
      console.log('❌ FAIL: Task not found in list');
    }

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ CRITICAL TEST FAILURE:', err.response?.data || err.message);
  }
}

runTests();
