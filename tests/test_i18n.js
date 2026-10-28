const http = require('http');

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: path,
      headers: cookie ? { 'Cookie': cookie } : {}
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b }));
    }).on('error', reject);
  });
}

let failures = 0;

function cookiesAre(res, lang) {
  const cookies = res.headers['set-cookie'] || [];
  return cookies.some(c => c.startsWith(`neotia_lang=${lang};`))
    && cookies.some(c => c.startsWith(`googtrans=${encodeURIComponent('/en/' + lang)};`));
}

async function testLanguages() {
  console.log('--- TESTING MULTILINGUAL IMPLEMENTATION ---');

  // Test 1: Default English
  const resEn = await get('/');
  console.log('\n[1] Default Homepage:');
  console.log('Status:', resEn.status);
  console.log('Has <html lang="en">:', resEn.body.includes('<html lang="en">'));
  console.log('Has Desktop Selector:', resEn.body.includes('id="langPillNav"'));
  console.log('Has Mobile Selector:', resEn.body.includes('mobile-lang-container'));
  console.log('Has i18n.js included:', resEn.body.includes('/js/i18n.js'));
  console.log('Has i18n.css included:', resEn.body.includes('/css/i18n.css'));

  // Test 2: Switch to Hindi via ?lang=hi
  const resHi = await get('/?lang=hi');
  console.log('\n[2] Request with ?lang=hi:');
  console.log('Status:', resHi.status);
  console.log('Set-Cookie headers:', resHi.headers['set-cookie']);
  console.log('Has <html lang="hi">:', resHi.body.includes('<html lang="hi">'));
  console.log('Shows हिन्दी in selector:', resHi.body.includes('हिन्दी'));

  // Test 3: Cookie persistence (request without ?lang, using cookie)
  const cookie = resHi.headers['set-cookie'] ? resHi.headers['set-cookie'][0].split(';')[0] : '';
  const resPersist = await get('/contact', cookie);
  console.log('\n[3] Navigation to /contact with cookie ' + cookie + ':');
  console.log('Has <html lang="hi">:', resPersist.body.includes('<html lang="hi">'));

  // Test 4: Switching back to English
  const resBack = await get('/contact?lang=en', cookie);
  console.log('\n[4] Request with ?lang=en after Hindi:');
  console.log('Has <html lang="en">:', resBack.body.includes('<html lang="en">'));
  console.log('Cookies reset to en:', cookiesAre(resBack, 'en'));

  // Test 5: Removed languages (bn, or) fall back to English and rewrite both cookies
  console.log('\n[5] Removed languages fall back to English:');
  const removedCases = [
    ['?lang=bn', '/?lang=bn', ''],
    ['?lang=or', '/experience?lang=or', ''],
    ['neotia_lang=bn cookie', '/contact', 'neotia_lang=bn'],
    ['googtrans=/en/or cookie', '/faq', 'googtrans=/en/or']
  ];
  for (const [label, path, staleCookie] of removedCases) {
    const res = await get(path, staleCookie);
    const ok = res.status === 200 && res.body.includes('<html lang="en">') && cookiesAre(res, 'en')
      && !res.body.includes('বাংলা') && !res.body.includes('ଓଡ଼ିଆ') && !/hreflang="(bn|or)"/.test(res.body);
    if (!ok) failures++;
    console.log(`${label}: ${ok ? 'PASS' : 'FAIL'}`);
  }

  // Test 6: Cross-Page Matrix
  console.log('\n[6] Testing 20 page-language combinations across the site...');
  const pages = [
    '/',
    '/contact',
    '/find-a-doctor',
    '/experience',
    '/specialised-services',
    '/book-an-appointment',
    '/faq',
    '/blog',
    '/obstetrics-gynaecology',
    '/paediatric-surgery'
  ];
  const langs = ['en', 'hi'];
  let passed = 0;
  let total = 0;

  for (const page of pages) {
    for (const lang of langs) {
      total++;
      const res = await get(`${page}?lang=${lang}`);
      const hasLang = res.body.includes(`<html lang="${lang}">`);
      const hasSelector = res.body.includes('id="langPillNav"');
      const hasPill = res.body.includes('neotia-lang-pill');
      const hasHreflang = res.body.includes(`hreflang="${lang}"`) && !/hreflang="(bn|or)"/.test(res.body);
      const hasScript = res.body.includes('/js/i18n.js');
      if (res.status === 200 && hasLang && hasSelector && hasPill && hasHreflang && hasScript) {
        passed++;
      } else {
        failures++;
        console.log(`Failed combination: ${page} [${lang}] Status: ${res.status}`);
      }
    }
  }
  console.log(`Matrix Result: ${passed} / ${total} passed successfully!`);
  if (failures) process.exitCode = 1;
}

testLanguages().catch(err => { console.error(err); process.exitCode = 1; });
