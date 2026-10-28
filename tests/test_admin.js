// Admin login for the tests comes from .env (ADMIN_USERNAME / ADMIN_PASSWORD), never hard-coded
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ADMIN_LOGIN = new URLSearchParams({ username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || '' }).toString();
// Server under test: npm start serves on 3000; set PORT to test another instance
const BASE = 'http://localhost:' + (process.env.PORT || 3000);

async function testAdmin() {
  console.log('--- TESTING ADMIN AUTH & CMS PAGES ---');

  // 1. Login
  const loginRes = await fetch(BASE + '/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: ADMIN_LOGIN,
    redirect: 'manual'
  });

  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status, 'Cookie received:', !!cookie);

  if (!cookie) {
    console.error('Failed to receive session cookie');
    return;
  }

  const adminPages = [
    '/admin',
    '/admin/appointments',
    '/admin/enquiries',
    '/admin/doctors',
    '/admin/doctors/new',
    '/admin/services',
    '/admin/services/new',
    '/admin/blogs',
    '/admin/blogs/new',
    '/admin/settings'
  ];

  let passed = 0;
  for (const page of adminPages) {
    const res = await fetch(`${BASE}${page}`, {
      headers: { Cookie: cookie }
    });
    const text = await res.text();
    console.log(`[${res.status}] ${BASE}${page} (${text.length} bytes)`);
    if (res.status === 200) passed++;
  }

  console.log(`\nAdmin CMS Tests Completed: ${passed}/${adminPages.length} passed.`);
}

testAdmin();
