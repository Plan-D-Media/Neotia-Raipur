const http = require('http');
const db = require('../database');

function makeRequest(path, method, data, headers = {}) {
    return new Promise((resolve, reject) => {
        let body = '';
        if (headers['Content-Type'] === 'application/json') {
            body = JSON.stringify(data);
        } else {
            body = new URLSearchParams(data).toString();
            headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded';
        }
        headers['Content-Length'] = Buffer.byteLength(body);

        const req = http.request({
            hostname: 'localhost',
            port: process.env.PORT || 3000,
            path: path,
            method: method,
            headers: headers
        }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(resBody);
                } catch(e) {}
                resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed, body: resBody });
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function runTests() {
    console.log('--- TESTING FORM SUBMISSION & BACKEND LEAD REFLECTION ---');

    // 1. Contact Form Submission (AJAX JSON)
    console.log('\n[1] Submitting Contact Us form via /form-sub/enquiry_submit.php...');
    const testPhoneContact = '9876543210';
    const contactRes = await makeRequest('/form-sub/enquiry_submit.php', 'POST', {
        name: 'Rajesh Mukherjee (Test Contact)',
        phone: testPhoneContact,
        email: 'rajesh.test@example.com',
        department: 'Paediatric Surgery',
        message: 'Inquiring about advanced laparoscopic surgical facilities for children.',
        source: 'Contact Us Page'
    }, {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    });
    console.log('Contact response status:', contactRes.statusCode);
    console.log('Contact response data:', contactRes.data);

    // 2. Callback Modal Form Submission
    console.log('\n[2] Submitting Callback Modal form via /form-sub/enquiry_submit.php...');
    const testPhoneCallback = '9830012345';
    const callbackRes = await makeRequest('/form-sub/enquiry_submit.php', 'POST', {
        name: 'Sneha Roy (Test Callback)',
        phone: testPhoneCallback,
        department: 'Obstetrics & Gynaecology',
        source: 'Website Header Callback Modal'
    }, {
        'Accept': 'application/json'
    });
    console.log('Callback response status:', callbackRes.statusCode);
    console.log('Callback response data:', callbackRes.data);

    // 3. Appointment Modal Form Submission
    console.log('\n[3] Submitting Doctor Appointment Popup via /form-sub/appointment_submit.php...');
    const testPhoneAppt = '9831198765';
    const apptRes = await makeRequest('/form-sub/appointment_submit.php', 'POST', {
        fname: 'Ananya Gupta (Test Child)',
        mobile: testPhoneAppt,
        email: 'gupta.parent@example.com',
        department: 'Paediatric Cardiology',
        consultant: 'Dr. Debasree Gangopadhyay',
        preffered_date: '2026-11-05',
        hospital_center: 'NBWCCC, Raipur'
    }, {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });
    console.log('Appointment response status:', apptRes.statusCode);
    console.log('Appointment response data:', apptRes.data);

    // 4. Verify in Database
    console.log('\n[4] Verifying leads in backend database...');
    db.init(); // Reload from disk to get changes made by server process
    const enquiries = db.getEnquiries();
    const contactLead = enquiries.find(e => e.phone === testPhoneContact);
    const callbackLead = enquiries.find(e => e.phone === testPhoneCallback);
    
    const appointments = db.getAppointments();
    const apptLead = appointments.find(a => a.phone === testPhoneAppt);

    console.log('Found Contact Lead:', contactLead ? `SUCCESS (ID: #${contactLead.id}, Dept: ${contactLead.department}, Source: ${contactLead.source})` : 'FAILED');
    console.log('Found Callback Lead:', callbackLead ? `SUCCESS (ID: #${callbackLead.id}, Dept: ${callbackLead.department}, Source: ${callbackLead.source})` : 'FAILED');
    console.log('Found Appointment Lead:', apptLead ? `SUCCESS (ID: #${apptLead.id}, Doctor: ${apptLead.doctor_name}, Status: ${apptLead.status})` : 'FAILED');

    if (contactLead && callbackLead && apptLead) {
        console.log('\n>>> ALL LEAD CAPTURE TESTS PASSED! LEADS ARE PROPERLY REFLECTED IN BACKEND DATABASE <<<');
    } else {
        console.log('\n>>> SOME TESTS FAILED! Check above logs. <<<');
    }
}

runTests().catch(console.error);
