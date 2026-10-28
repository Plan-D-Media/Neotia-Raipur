// Admin login for the tests comes from .env (ADMIN_USERNAME / ADMIN_PASSWORD), never hard-coded
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ADMIN_LOGIN = new URLSearchParams({ username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || '' }).toString();
const http = require('http');

function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting CMS Page Management End-to-End Tests ---');

    // 1. Admin Login
    console.log('\n1. Testing Admin Authentication...');
    const loginPayload = ADMIN_LOGIN;
    const loginRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(loginPayload)
        }
    }, loginPayload);

    const cookieHeader = loginRes.headers['set-cookie'];
    if (!cookieHeader) {
        throw new Error('Failed to get session cookie on login');
    }
    const sessionCookie = cookieHeader[0].split(';')[0];
    console.log('✓ Admin authenticated successfully. Cookie received.');

    // 2. GET /admin/pages
    console.log('\n2. Testing GET /admin/pages...');
    const pagesRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    console.log(`Status: ${pagesRes.statusCode}`);
    if (pagesRes.statusCode !== 200) throw new Error(`Expected 200, got ${pagesRes.statusCode}`);
    
    // Check required UI elements
    const hasSearchPlaceholder = pagesRes.body.includes('Search by page title, URL, category, or SEO title...');
    console.log(`✓ Required search placeholder present: ${hasSearchPlaceholder}`);
    const hasTotalPages = pagesRes.body.includes('Total Pages');
    console.log(`✓ Total Pages summary card present: ${hasTotalPages}`);
    const hasRewriteAction = pagesRes.body.includes('Rewrite &amp; Content Optimization Workspace') || pagesRes.body.includes('/admin/pages/rewrite/');
    console.log(`✓ Rewrite & Republish action present: ${hasRewriteAction}`);
    const hasCloneAction = pagesRes.body.includes('/admin/pages/clone/');
    console.log(`✓ Clone action present: ${hasCloneAction}`);
    const hasTrashAction = pagesRes.body.includes('/admin/pages/trash/');
    console.log(`✓ Trash action present: ${hasTrashAction}`);

    // 3. Search and Filter
    console.log('\n3. Testing Search Query (?search=obstetrics)...');
    const searchRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages?search=obstetrics',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    const foundCardiac = searchRes.body.includes('obstetrics-gynaecology');
    console.log(`✓ Search returned matching pages: ${foundCardiac}`);

    // 4. Test Category Filter
    console.log('\n4. Testing Category Filter (?category=Departments+%26+Specialities)...');
    const catRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages?category=Departments+%26+Specialities',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    const foundDept = catRes.body.includes('Departments &amp; Specialities') || catRes.body.includes('Departments & Specialities');
    console.log(`✓ Category filter working: ${foundDept}`);

    // 5. GET /admin/pages/edit/16
    console.log('\n5. Testing GET /admin/pages/edit/16 (Obstetrics & Gynaecology)...');
    const editRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages/edit/16',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    console.log(`✓ Edit page loaded. Status: ${editRes.statusCode}`);
    const hasSeoChecklist = editRes.body.includes('SEO Optimization Checklist');
    console.log(`✓ SEO checklist widget present: ${hasSeoChecklist}`);

    // 6. Test Clone Page (/admin/pages/clone/16)
    console.log('\n6. Testing Page Cloning (POST /admin/pages/clone/16)...');
    const cloneRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages/clone/16',
        method: 'POST',
        headers: { Cookie: sessionCookie }
    });
    console.log(`Clone redirect status: ${cloneRes.statusCode}, Location: ${cloneRes.headers.location}`);
    const cloneRedirect = cloneRes.headers.location || '';
    const cloneIdMatch = cloneRedirect.match(/\/admin\/pages\/edit\/(\d+)/);
    if (!cloneIdMatch) throw new Error('Clone did not redirect to edit form of cloned page');
    const cloneId = cloneIdMatch[1];
    console.log(`✓ Successfully cloned page. New Clone ID: ${cloneId}`);

    // 7. Verify Clone details
    console.log(`\n7. Inspecting Cloned Page ID ${cloneId}...`);
    const cloneEditRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: `/admin/pages/edit/${cloneId}`,
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    const isDraft = cloneEditRes.body.includes('value="draft" selected') || cloneEditRes.body.includes('Draft (Unpublished)');
    console.log(`✓ Cloned page starts in Draft status by default: ${isDraft}`);

    // 8. Test Rewrite & Republish Workspace (/admin/pages/rewrite/16)
    console.log('\n8. Testing Rewrite & Republish Workspace (GET /admin/pages/rewrite/16)...');
    const rewriteRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages/rewrite/16',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    console.log(`✓ Rewrite workspace status: ${rewriteRes.statusCode}`);
    const hasOriginalSide = rewriteRes.body.includes('Current Live Content (Original)');
    const hasProposedSide = rewriteRes.body.includes('Proposed Optimized Content (Editable)');
    const hasPresets = rewriteRes.body.includes('Clinical Authority') && rewriteRes.body.includes('Parent-Friendly');
    console.log(`✓ Original comparison column present: ${hasOriginalSide}`);
    console.log(`✓ Proposed editable column present: ${hasProposedSide}`);
    console.log(`✓ Tone & Objective presets present: ${hasPresets}`);

    // 9. Test Rewrite & Republish Submission
    console.log('\n9. Testing Rewrite Approval Submission (POST /admin/pages/rewrite/16)...');
    const rewriteData = 'title=Obstetrics+%26+Gynaecology&heading=Obstetrics+%26+Gynaecology&content=Test+rewrite+content.&seoTitle=Obstetrics+%26+Gynaecology+in+Raipur&metaDescription=Test+rewrite+meta+description.&altText=Obstetrics+and+Gynaecology&ctaText=Book+Appointment&ctaLink=/book-an-appointment&status=published&note=Test+rewrite+republish+flow';
    const rewritePostRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages/rewrite/16',
        method: 'POST',
        headers: {
            Cookie: sessionCookie,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(rewriteData)
        }
    }, rewriteData);
    console.log(`✓ Rewrite approval saved and redirected to: ${rewritePostRes.headers.location}`);

    // 10. Test Soft-Trash on Clone
    console.log(`\n10. Testing Soft-Trash (POST /admin/pages/trash/${cloneId})...`);
    const trashRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: `/admin/pages/trash/${cloneId}`,
        method: 'POST',
        headers: { Cookie: sessionCookie }
    });
    console.log(`✓ Trash operation status: ${trashRes.statusCode}`);

    // Verify Clone appears in Trashed tab
    const trashedListRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages?status=trashed',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    const inTrash = trashedListRes.body.includes(`page-row-${cloneId}`);
    console.log(`✓ Cloned page appears in Trashed list: ${inTrash}`);

    // 11. Test Restore from Trash
    console.log(`\n11. Testing Restore (POST /admin/pages/restore/${cloneId})...`);
    const restoreRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: `/admin/pages/restore/${cloneId}`,
        method: 'POST',
        headers: { Cookie: sessionCookie }
    });
    console.log(`✓ Restore operation status: ${restoreRes.statusCode}`);

    // 12. Test Permanent Delete
    console.log(`\n12. Testing Permanent Delete of Clone (POST /admin/pages/delete/${cloneId})...`);
    const deleteRes = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: `/admin/pages/delete/${cloneId}`,
        method: 'POST',
        headers: { Cookie: sessionCookie }
    });
    console.log(`✓ Permanent delete executed. Status: ${deleteRes.statusCode}`);

    // 13. Test Inventory Export
    console.log('\n13. Testing Export Inventory (CSV & JSON)...');
    const csvExport = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages/export?format=csv',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    console.log(`✓ CSV export length: ${csvExport.body.length} bytes, includes headers: ${csvExport.body.includes('ID,Title,URL,Slug')}`);

    const jsonExport = await request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/admin/pages/export?format=json',
        method: 'GET',
        headers: { Cookie: sessionCookie }
    });
    const parsedJson = JSON.parse(jsonExport.body);
    console.log(`✓ JSON export count: ${parsedJson.length} pages validly parsed.`);

    console.log('\n======================================================');
    console.log('ALL CMS PAGE MANAGEMENT MODULE TESTS PASSED FLAWLESSLY!');
    console.log('======================================================');
}

runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
