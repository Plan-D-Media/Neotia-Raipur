const http = require('http');

function postForm(path, data) {
    return new Promise((resolve, reject) => {
        const body = new URLSearchParams(data).toString();
        const req = http.request({
            hostname: 'localhost',
            port: process.env.PORT || 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body),
                'X-Requested-With': 'XMLHttpRequest'
            }
        }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resBody) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: resBody });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function run() {
    console.log('--- TESTING APPOINTMENT BOOKING FLOW ---');
    let sessionCookie = '';

    // Step 1
    const res1 = await new Promise((resolve, reject) => {
        const body = new URLSearchParams({
            department_id: '1##Paediatric Cardiology & Heart Care',
            doctor_id: '2##Dr. Debasree Gangopadhyay',
            appointment_date: '2026-10-25',
            appointment_time: 'Morning (9:00 AM - 1:00 PM)'
        }).toString();

        const req = http.request({
            hostname: 'localhost',
            port: process.env.PORT || 3000,
            path: '/form-sub/book_appointment_submit_step.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            if (res.headers['set-cookie']) {
                sessionCookie = res.headers['set-cookie'][0].split(';')[0];
            }
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(resBody) }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
    console.log('Step 1 response:', res1);

    // Step 2
    const res2 = await new Promise((resolve, reject) => {
        const body = new URLSearchParams({
            name: 'Aarav Sharma',
            phone: '9876543210',
            email: 'aarav.sharma@example.com',
            address: 'Action Area II, New Town',
            query: 'Routine pediatric checkup'
        }).toString();

        const req = http.request({
            hostname: 'localhost',
            port: process.env.PORT || 3000,
            path: '/form-sub/book_appointment_submit_step.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body),
                'Cookie': sessionCookie
            }
        }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(resBody) }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
    console.log('Step 2 response:', res2);

    // Enquiry submission
    const res3 = await new Promise((resolve, reject) => {
        const body = new URLSearchParams({
            name: 'Priyanka Sen',
            phone: '9123456789',
            email: 'priyanka@example.com',
            department: 'Paediatric Intensive Care Unit (PICU)',
            message: 'Need info regarding admission requirements.'
        }).toString();

        const req = http.request({
            hostname: 'localhost',
            port: process.env.PORT || 3000,
            path: '/form-sub/enquiry_submit.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(resBody) }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
    console.log('Enquiry response:', res3);
}

run().catch(console.error);
