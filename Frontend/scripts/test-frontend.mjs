import http from 'http';

const BASE_URL = 'http://localhost:3000';

const PAGES_TO_TEST = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/plan',
  '/chat',
  '/subjects',
  '/library',
  '/settings',
  '/chats',
  '/progress'
];

const APIS_TO_TEST = [
  { path: '/api/analyze', method: 'GET', expectedStatus: 405 }, // POST expected
  { path: '/api/chat', method: 'GET', expectedStatus: 405 },
  { path: '/api/viva/evaluate', method: 'GET', expectedStatus: 405 },
  { path: '/api/viva/tts', method: 'GET', expectedStatus: 405 }
];

async function checkUrl(path, method = 'GET', expectedStatus = 200) {
  return new Promise((resolve) => {
    const req = http.request(`${BASE_URL}${path}`, { method }, (res) => {
      // Discard response body
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode === expectedStatus || (expectedStatus === 200 && res.statusCode >= 200 && res.statusCode < 400)) {
          resolve({ ok: true, status: res.statusCode });
        } else {
          resolve({ ok: false, status: res.statusCode, expected: expectedStatus });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ ok: false, error: e.message });
    });

    req.end();
  });
}

async function runTests() {
  console.log(`\n🧪 Starting Frontend Live Tests on ${BASE_URL}...\n`);
  
  let passed = 0;
  let failed = 0;

  // Wait briefly to ensure dev server is up
  try {
    await checkUrl('/');
  } catch {
    console.error("❌ Cannot connect to localhost:3000. Make sure `npm run dev` is running!");
    process.exit(1);
  }

  console.log('--- Testing Pages ---');
  for (const page of PAGES_TO_TEST) {
    const result = await checkUrl(page);
    if (result.ok) {
      console.log(`✅ [PASS] ${page} (Status: ${result.status})`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${page} (Status: ${result.status}, Error: ${result.error || ''})`);
      failed++;
    }
  }

  console.log('\n--- Testing API Endpoints ---');
  for (const api of APIS_TO_TEST) {
    const result = await checkUrl(api.path, api.method, api.expectedStatus);
    if (result.ok) {
      console.log(`✅ [PASS] ${api.path} (Method: ${api.method}, Status: ${result.status})`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${api.path} (Method: ${api.method}, Expected: ${api.expectedStatus}, Got: ${result.status})`);
      failed++;
    }
  }

  console.log('\n--- Test Summary ---');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error("\n⚠️ Some tests failed!");
    process.exit(1);
  } else {
    console.log("\n🎉 All tests passed successfully!");
    process.exit(0);
  }
}

runTests();
