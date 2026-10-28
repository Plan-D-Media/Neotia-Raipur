// Server under test: npm start serves on 3000; set PORT to test another instance
const BASE = 'http://localhost:' + (process.env.PORT || 3000);

const urls = [
  BASE + '/',
  BASE + '/find-a-doctor',
  BASE + '/doctor/dr-aritra-mukherji',
  BASE + '/specialised-services',
  BASE + '/obstetrics-gynaecology',
  BASE + '/neonatal-intensive-care',
  BASE + '/book-an-appointment',
  BASE + '/blog',
  BASE + '/blog-details/vaccination-hospital-for-kids-kolkata',
  BASE + '/experience',
  BASE + '/contact',
  BASE + '/faq',
  BASE + '/privacy-and-policies',
  BASE + '/disclaimer',
  BASE + '/admin/login'
];

async function run() {
  console.log('--- TESTING PUBLIC PAGES ---');
  let passed = 0;
  for (const u of urls) {
    try {
      const res = await fetch(u);
      const text = await res.text();
      console.log(`[${res.status}] ${u} (${text.length} bytes)`);
      if (res.status === 200) passed++;
    } catch (err) {
      console.error(`[FAIL] ${u}: ${err.message}`);
    }
  }

  console.log('\n--- TESTING API ENDPOINTS ---');
  // 1. Suggestions
  try {
    const resSug = await fetch(BASE + '/form-sub/search_suggestions.php?keyword=aritra');
    const dataSug = await resSug.json();
    console.log('[API search_suggestions]', dataSug.Doctors.length > 0 ? 'PASS' : 'FAIL', dataSug);
  } catch (err) {
    console.error('[API search_suggestions error]', err.message);
  }

  // 2. Get doctors
  try {
    const resDoc = await fetch(BASE + '/form-sub/get_doctors.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'department_id=14##Paediatrics'
    });
    const htmlDoc = await resDoc.text();
    console.log('[API get_doctors]', htmlDoc.includes('Dr. Aritra Mukherji') ? 'PASS' : 'FAIL', htmlDoc.substring(0, 100));
  } catch (err) {
    console.error('[API get_doctors error]', err.message);
  }

  // 3. Callback submit
  try {
    const resEnq = await fetch(BASE + '/form-sub/enquiry_submit.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=Test+Parent&phone=9876543210&department=General+Paediatrics&message=Checking+facilities'
    });
    const dataEnq = await resEnq.json();
    console.log('[API enquiry_submit]', dataEnq.rettype === 'success' ? 'PASS' : 'FAIL', dataEnq);
  } catch (err) {
    console.error('[API enquiry_submit error]', err.message);
  }

  console.log(`\nTests Completed: ${passed}/${urls.length} pages returned 200 OK.`);

  // 4. Raipur speciality list: 13 visible pages, 301s from renamed slugs, hidden sub-specialities 404
  console.log('\n--- TESTING SPECIALITIES ---');
  let failures = passed === urls.length ? 0 : 1;
  const visible = ['obstetrics-gynaecology', 'maternity-birthing', 'foetal-medicine', 'womens-health', 'lactation-support',
    'fertility-ivf', 'paediatrics', 'neonatal-intensive-care', 'paediatric-intensive-care', 'paediatric-surgery',
    'vaccination', 'diagnostics', 'emergency'];
  for (const slug of visible) {
    const res = await fetch(`${BASE}/${slug}`);
    if (res.status !== 200) { failures++; console.log(`[FAIL ${res.status}] /${slug}`); }
  }
  console.log(`Visible specialities: ${visible.length} checked`);
  const renamed = {
    'obstetrics-and-gynaecology': 'obstetrics-gynaecology', 'foetal-medicine-and-maternal-care': 'foetal-medicine',
    'fertility-and-reproductive-medicine': 'fertility-ivf', 'paediatric-medicine': 'paediatrics',
    'vaccination-and-preventive-care': 'vaccination', 'ct-mri-scan': 'diagnostics'
  };
  for (const [from, to] of Object.entries(renamed)) {
    const res = await fetch(`${BASE}/${from}`, { redirect: 'manual' });
    const ok = res.status === 301 && res.headers.get('location') === `/${to}`;
    if (!ok) failures++;
    console.log(`[${ok ? 'PASS' : 'FAIL'}] /${from} -> ${res.status} ${res.headers.get('location')}`);
  }
  const hidden = ['paediatric-cardiac-science', 'paediatric-gastroenterology', 'paediatric-neurology', 'paediatric-orthopaedics',
    'paediatric-nephrology', 'paediatric-urology', 'paediatric-endocrinology', 'paediatric-ent', 'paediatric-dentistry', 'cardiac-cath-lab'];
  for (const slug of hidden) {
    for (const url of [`${BASE}/${slug}`, `${BASE}/find-a-doctor/${slug}`]) {
      const res = await fetch(url);
      if (res.status !== 404) { failures++; console.log(`[FAIL ${res.status}] ${url} should be 404`); }
    }
  }
  console.log(`Hidden specialities: ${hidden.length} checked (page + find-a-doctor)`);
  console.log(failures ? `SPECIALITY TESTS: ${failures} failure(s)` : 'SPECIALITY TESTS PASSED');
  if (failures) process.exitCode = 1;
}

run();
