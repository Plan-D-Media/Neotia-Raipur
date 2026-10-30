// Settings and secrets come from .env (see .env.example); load them before anything reads process.env
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');

// Production must be configured explicitly; development falls back with a warning
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const missingSettings = ['SESSION_SECRET', 'PASSWORD_SALT', 'ADMIN_PASSWORD'].filter(name => !process.env[name]);
if (missingSettings.length) {
    if (IS_PRODUCTION) {
        console.error(`Refusing to start: ${missingSettings.join(', ')} not set. Copy .env.example to .env and fill it in.`);
        process.exit(1);
    }
    console.warn(`[Config] Not set: ${missingSettings.join(', ')}. Copy .env.example to .env (fine for a quick local look, not for production).`);
}
// Without SESSION_SECRET (development only) sessions use a throwaway key and end on restart
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const db = require('./database');

// Read-only review mode: on Vercel (VERCEL is set by the platform) or with PREVIEW_MODE=true
const PREVIEW_MODE = db.isPreview();
const PREVIEW_MESSAGE = "Preview mode: changes aren't saved";

const app = express();
const PORT = process.env.PORT || 3000;

// Specialities shown on the public site, in Raipur sitemap order (Woman Care -> Child Care -> Support).
// Departments set to "draft" stay in the data (e.g. the paediatric sub-specialities) but are hidden and 404.
function visibleDepartments() {
    return db.getDepartments()
        .filter(d => d.status !== 'draft')
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function visibleDepartmentBySlug(slug) {
    const dept = db.getDepartmentBySlug(slug);
    return dept && dept.status !== 'draft' ? dept : null;
}

function isHiddenDepartment(slug) {
    const dept = db.getDepartmentBySlug(slug);
    return !!dept && dept.status === 'draft';
}

// Doctors matched to a speciality name. getDoctors() falls back to every doctor when nothing
// matches, which would list unrelated doctors; this returns [] instead.
function matchedDoctors(specialityName) {
    const list = db.getDoctors({ speciality: specialityName });
    return list.length === db.getDoctors().length ? [] : list;
}

// Doctors for a speciality page; pages whose copy is still pending show none.
function doctorsForDepartment(dept) {
    if (dept.copyPending) return [];
    return matchedDoctors(dept.name);
}

// Old speciality URLs -> Raipur sitemap slugs (301)
const RENAMED_SPECIALITIES = {
    'obstetrics-and-gynaecology': 'obstetrics-gynaecology',
    'foetal-medicine-and-maternal-care': 'foetal-medicine',
    'fertility-and-reproductive-medicine': 'fertility-ivf',
    'paediatric-medicine': 'paediatrics',
    'vaccination-and-preventive-care': 'vaccination',
    'ct-mri-scan': 'diagnostics'
};

// Setup upload parser
const upload = multer();

// Multer disk storage for page media uploads
const pageUploadDir = path.join(__dirname, 'public', 'upload', 'pages');
// Vercel's filesystem is read-only, and uploads are disabled in preview mode anyway
if (!PREVIEW_MODE && !fs.existsSync(pageUploadDir)) {
    fs.mkdirSync(pageUploadDir, { recursive: true });
}
const pageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pageUploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '-');
        cb(null, `${cleanName}-${Date.now()}${ext}`);
    }
});
const pageUpload = multer({ storage: pageStorage });

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
// Preview mode: keep the review site out of search engines, and tell the templates
app.use((req, res, next) => {
    res.locals.previewMode = PREVIEW_MODE;
    if (PREVIEW_MODE) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
});
// Local static files. On Vercel, public/ is served by the CDN at the same URLs and this is skipped.
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    const m = req.path.match(/^\/(find-a-doctor\/|book-an-appointment\/)?([a-z0-9-]+)\/?$/);
    if ((req.method === 'GET' || req.method === 'HEAD') && m && RENAMED_SPECIALITIES[m[2]]) {
        const query = req.originalUrl.slice(req.originalUrl.indexOf('?') === -1 ? req.originalUrl.length : req.originalUrl.indexOf('?'));
        return res.redirect(301, '/' + (m[1] || '') + RENAMED_SPECIALITIES[m[2]] + query);
    }
    next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// Sessions live in a signed cookie (no server-side store), so admin login works on stateless hosts like Vercel
if (process.env.VERCEL) app.set('trust proxy', 1);
app.use(cookieSession({
    name: 'neotia_session',
    keys: [SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: 'lax',
    secure: !!process.env.VERCEL
}));

// Preview mode: admin can log in and look around, but every admin write is refused (before any upload is parsed)
if (PREVIEW_MODE) {
    app.use('/admin', (req, res, next) => {
        res.locals.previewBlocked = req.query.preview_blocked === '1';
        if (req.method === 'GET' || req.method === 'HEAD' || req.path === '/login') return next();
        console.log(`[Preview mode] Blocked admin write: ${req.method} ${req.originalUrl}`);
        const wantsJson = req.xhr || req.originalUrl.includes('/api/') || (req.get('accept') || '').includes('application/json');
        if (wantsJson) {
            return res.status(403).json({ success: false, message: PREVIEW_MESSAGE });
        }
        // Back to the page the form came from, with the preview banner highlighted
        let back = '/admin';
        try {
            const ref = new URL(req.get('referer') || '', `${req.protocol}://${req.get('host')}`);
            if (ref.host === req.get('host') && ref.pathname.startsWith('/admin')) back = ref.pathname + ref.search;
        } catch (e) { /* no usable referer */ }
        const url = new URL(back, 'http://local');
        url.searchParams.set('preview_blocked', '1');
        res.redirect(303, url.pathname + url.search);
    });
}

// Global template locals (makes departments, siteInfo, doctors, i18n available everywhere)
app.use((req, res, next) => {
    // Multilingual Language Detection & Persistence (Supports en, hi)
    const supportedLangs = [
        { code: 'en', name: 'English', native: 'English', badge: 'EN' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', badge: 'HI' }
    ];
    const isSupportedLang = code => supportedLangs.some(l => l.code === code);
    const googtransLang = (req.cookies.googtrans || '').split('/')[2];
    // Languages we used to offer (bn, or) or junk values send the visitor back to English
    const hasStaleLang = [req.query.lang, req.cookies.neotia_lang, googtransLang].some(l => l && !isSupportedLang(l));
    let currentLang = req.query.lang || req.cookies.neotia_lang || 'en';
    if (!isSupportedLang(currentLang)) {
        currentLang = 'en';
    }
    if ((req.query.lang && isSupportedLang(req.query.lang)) || hasStaleLang) {
        res.cookie('neotia_lang', currentLang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
        res.cookie('googtrans', `/en/${currentLang}`, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
    }
    res.locals.currentLang = currentLang;
    res.locals.supportedLangs = supportedLangs;

    res.locals.departments = visibleDepartments();
    res.locals.doctors = db.getDoctors();
    res.locals.siteInfo = db.getSiteInfo();
    // Public domain for canonical / og:url. Empty = relative links only (Raipur domain not final yet)
    res.locals.siteUrl = (process.env.SITE_URL || res.locals.siteInfo.siteUrl || '').replace(/\/+$/, '');
    // Public reCAPTCHA v3 site key for the forms (public by design, but tied to a domain)
    res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || '';
    res.locals.currentPath = req.path;
    res.locals.adminUser = req.session.adminUser || null;

    // Check if URL matches a managed page in the CMS
    const managedPage = db.getPageByUrl(req.path) || (req.path === '/' ? (db.getPageBySlug('homepage') || db.getPageById(1)) : null);
    if (managedPage) {
        res.locals.currentPage = managedPage;
        res.locals.page = managedPage;
        if (managedPage.seoTitle) res.locals.title = managedPage.seoTitle;
        if (managedPage.metaDescription) res.locals.description = managedPage.metaDescription;

        // If page is draft or trashed and requested publicly, enforce 404 unless admin preview
        if (!req.path.startsWith('/admin') && !req.path.startsWith('/form-sub')) {
            const isAdmin = req.session && req.session.adminUser;
            const isPreview = req.query.preview === 'admin' || req.query.preview === '1';
            if (managedPage.status === 'trashed') {
                return res.status(404).render('404');
            }
            if (managedPage.status === 'draft' && (!isAdmin || !isPreview)) {
                return res.status(404).render('404');
            }
        }
    }
    next();
});

// Helper for rendering admin views wrapped in layout
function renderAdmin(res, view, data = {}) {
    const defaultData = {
        activeTab: data.activeTab || 'dashboard',
        pageHeading: data.pageHeading || 'Admin Dashboard',
        adminUser: res.locals.adminUser
    };
    res.render(path.join('admin', view), { ...defaultData, ...data }, (err, html) => {
        if (err) {
            console.error('Error rendering admin view:', err);
            return res.status(500).send('Admin rendering error: ' + err.message);
        }
        res.render('admin/layout', { ...defaultData, ...data, body: html });
    });
}

// Authentication Guard
function requireAdmin(req, res, next) {
    if (req.session && req.session.adminUser) {
        return next();
    }
    res.redirect('/admin/login');
}

// ==========================================
// PUBLIC FRONTEND ROUTES
// ==========================================

// 1. Homepage
app.get('/', (req, res) => {
    const page = db.getPageByUrl('/') || db.getPageById(1);
    const blogs = db.getBlogs();
    res.render('index', {
        page,
        currentPage: page,
        blogs
    });
});

// 2. Find a Doctor
app.all('/find-a-doctor', (req, res) => {
    const search = req.query.search || req.body?.search || req.body?.search_keyword || req.query.search_keyword || '';
    const speciality = req.query.speciality || req.body?.speciality || '';
    const departments = visibleDepartments();
    const doctors = db.getDoctors({ search, speciality });
    res.render('find-a-doctor', {
        doctors,
        departments,
        query: { search, speciality, search_keyword: search, ...req.query, ...req.body }
    });
});

// 2b. Find a Doctor by Department slug
app.get('/find-a-doctor/:deptSlug', (req, res) => {
    if (isHiddenDepartment(req.params.deptSlug)) {
        return res.status(404).render('404');
    }
    const dept = visibleDepartmentBySlug(req.params.deptSlug);
    const departments = visibleDepartments();
    let doctors = [];
    if (dept) {
        doctors = db.getDoctors({ speciality: dept.name });
    } else {
        const cleanName = req.params.deptSlug.replace(/-/g, ' ');
        doctors = db.getDoctors({ speciality: cleanName });
    }
    res.render('find-a-doctor', {
        doctors,
        departments,
        query: { speciality: dept ? dept.name : req.params.deptSlug }
    });
});

// 2c. Doctor Appointment Popup
app.get('/book-an-appointment-popup/:slug', (req, res) => {
    const doctor = db.getDoctorBySlug(req.params.slug);
    const departments = visibleDepartments();
    res.render('partials/appointment-popup', {
        doctor: doctor || { name: req.params.slug.replace(/-/g, ' '), speciality: 'General' },
        departments
    });
});

// 3. Individual Doctor Page
app.get('/doctor/:slug', (req, res) => {
    const doctor = db.getDoctorBySlug(req.params.slug);
    if (!doctor) {
        return res.status(404).render('404');
    }
    // Related specialists in the same field
    const relatedDoctors = db.getDoctors({ speciality: doctor.speciality }).filter(d => d.slug !== doctor.slug).slice(0, 4);
    res.render('doctor-detail', {
        doctor,
        relatedDoctors
    });
});

// 4. Specialised Services Directory
app.get('/specialised-services', (req, res) => {
    res.render('specialised-services');
});

// 5. Book an Appointment Flow
app.get('/book-an-appointment', (req, res) => {
    res.render('book-an-appointment', {
        query: req.query
    });
});

app.get('/book-an-appointment/:deptSlug', (req, res) => {
    const dept = visibleDepartmentBySlug(req.params.deptSlug);
    res.render('book-an-appointment', {
        query: { department: dept ? dept.name : req.params.deptSlug }
    });
});

// 6. Experience Page
app.get('/experience', (req, res) => {
    res.render('experience');
});

// 7. Blog & Health Insights
app.get('/blog', (req, res) => {
    const blogs = db.getBlogs();
    res.render('blog', { blogs });
});

app.get('/blog-details/:slug', (req, res) => {
    const blog = db.getBlogBySlug(req.params.slug);
    if (!blog) {
        return res.status(404).render('404');
    }
    const recentBlogs = db.getBlogs().filter(b => b.slug !== blog.slug).slice(0, 4);
    res.render('blog-detail', {
        blog,
        recentBlogs
    });
});

// 8. Contact Page
app.get('/contact', (req, res) => {
    res.render('contact');
});

// 9. FAQ Page
app.get('/faq', (req, res) => {
    const faqs = db.getFaqs();
    res.render('faq', { faqs });
});

// 10. Privacy and Disclaimer
app.get('/privacy-and-policies', (req, res) => {
    res.render('privacy');
});

app.get('/disclaimer', (req, res) => {
    res.render('disclaimer');
});

// 11. Confirmation Pages
app.get('/thank-you-for-appointment', (req, res) => {
    res.render('thank-you-appointment');
});

app.get('/thank-you-for-enquiry', (req, res) => {
    res.render('thank-you-enquiry');
});

// ==========================================
// AJAX & FORM SUBMISSION API ENDPOINTS
// Matching exact contracts of live site
// ==========================================

// Get Doctors for selected Department (AJAX)
app.post('/form-sub/get_doctors.php', upload.none(), (req, res) => {
    const deptVal = req.body.department_id || req.body.department || '';
    let deptName = deptVal;
    if (deptVal.includes('##')) {
        deptName = deptVal.split('##')[1];
    }

    // matched_only=1 (booking form on speciality pages): "Any Doctor" first, then only the doctors
    // matched to the department, so a department with none shows just "Any Doctor"
    if (req.body.matched_only === '1') {
        let options = `<option value="">Select Doctor</option><option value="Any Doctor">Any Doctor</option>`;
        matchedDoctors(deptName).forEach(doc => {
            options += `<option value='${doc.id}##${doc.name}'>${doc.name}</option>`;
        });
        return res.send(options);
    }

    const doctors = deptName ? db.getDoctors({ speciality: deptName }) : db.getDoctors();
    let options = `<option value="">Doctor</option>`;
    doctors.forEach(doc => {
        options += `<option value='${doc.id}##${doc.name}'>${doc.name}</option>`;
    });

    res.send(options);
});

// Multi-step Appointment Booking (AJAX)
app.post('/form-sub/book_appointment_submit_step.php', upload.none(), (req, res) => {
    const body = req.body;
    const isStep1 = body.step === '1' || (body.fname && !body.consultant && !body.email) || (body.department_id && !body.name && !body.phone);

    // Check if step 1
    if (isStep1) {
        req.session.tempAppointment = {
            fname: body.fname || body.name || '',
            name: body.fname || body.name || '',
            mobile: body.mobile || body.phone || '',
            phone: body.mobile || body.phone || '',
            department_id: body.department_id || body.department || '',
            doctor_id: body.doctor_id || body.consultant || '',
            appointment_date: body.appointment_date || body.preffered_date || '',
            appointment_time: body.appointment_time || ''
        };
        return res.json({ rettype: 'success', retmessage: 'Step 1 saved successfully' });
    }

    // Step 2 submission
    let deptName = '';
    let docName = '';
    const temp = req.session.tempAppointment || {};

    const deptRaw = body.department || body.department_id || temp.department_id || '';
    if (deptRaw.includes('##')) deptName = deptRaw.split('##')[1];
    else deptName = deptRaw;

    const docRaw = body.consultant || body.doctor_id || temp.doctor_id || '';
    if (docRaw.includes('##')) docName = docRaw.split('##')[1];
    else docName = docRaw;

    const appointment = db.createAppointment({
        department_id: deptRaw,
        department_name: deptName || 'General Paediatrics',
        doctor_id: docRaw,
        doctor_name: docName || 'Any Specialist',
        appointment_date: body.preffered_date || body.appointment_date || temp.appointment_date || new Date().toISOString().split('T')[0],
        appointment_time: body.appointment_time || temp.appointment_time || 'Morning',
        name: body.fname || temp.fname || body.name || temp.name || 'Anonymous Patient',
        phone: body.mobile || temp.mobile || body.phone || temp.phone || '',
        email: body.email || temp.email || '',
        address: body.address || temp.address || '',
        query: body.query || temp.query || '',
        hospital_center: body.hospital_center || db.getSiteInfo().hospitalCentre,
        status: 'New'
    });

    // Clear session temp
    delete req.session.tempAppointment;

    res.json({
        rettype: 'success',
        retmessage: 'Appointment booked successfully',
        appointmentId: appointment.id
    });
});

// Single step appointment submit (AJAX)
app.post('/form-sub/book_appointment_submit.php', upload.none(), (req, res) => {
    const body = req.body;
    let deptName = body.department_id || '';
    if (deptName.includes('##')) deptName = deptName.split('##')[1];

    let docName = body.doctor_id || '';
    if (docName.includes('##')) docName = docName.split('##')[1];

    const appointment = db.createAppointment({
        department_id: body.department_id,
        department_name: deptName || 'General Paediatrics',
        doctor_id: body.doctor_id,
        doctor_name: docName || 'Any Specialist',
        appointment_date: body.appointment_date || new Date().toISOString().split('T')[0],
        appointment_time: body.appointment_time || 'Morning',
        name: body.name || '',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        query: body.query || '',
        status: 'New'
    });

    res.json({
        rettype: 'success',
        status: 'success',
        success: true,
        retmessage: 'Appointment booked successfully',
        appointmentId: appointment.id
    });
});

// Modal Doctor Appointment Submit (AJAX from appointment-popup)
app.post('/form-sub/appointment_submit.php', upload.none(), (req, res) => {
    const body = req.body || {};
    let deptName = body.department || body.department_id || '';
    if (deptName.includes('##')) deptName = deptName.split('##')[1];

    let docName = body.consultant || body.doctor_id || '';
    if (docName.includes('##')) docName = docName.split('##')[1];

    const appointment = db.createAppointment({
        department_id: body.department_id || '',
        department_name: deptName || 'General Paediatrics',
        doctor_id: body.doctor_id || '',
        doctor_name: docName || 'Any Specialist',
        appointment_date: body.preffered_date || body.appointment_date || new Date().toISOString().split('T')[0],
        appointment_time: body.appointment_time || 'Morning',
        name: body.fname || body.name || 'Anonymous Patient',
        phone: body.mobile || body.phone || '',
        email: body.email || '',
        address: body.address || '',
        query: body.query || '',
        hospital_center: body.hospital_center || 'NBWCCC, Raipur',
        status: 'New'
    });

    console.log(`[Appointment Lead Captured] ID: #${appointment.id} | Name: ${appointment.name} | Doctor: ${appointment.doctor_name} | Phone: ${appointment.phone}`);

    res.json({
        rettype: 'success',
        status: 'success',
        success: true,
        retmessage: 'Appointment booked successfully',
        appointmentId: appointment.id
    });
});

// Callback & Contact Form Submission (AJAX & Form POST)
const handleEnquirySubmission = (req, res) => {
    const body = req.body || {};
    const rawPhone = (body.phone || body.mobile || '').trim();
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');

    if (!cleanPhone || cleanPhone.length < 8) {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json')) || req.path.includes('form-sub')) {
            return res.json({ rettype: 'error', status: 'error', retmessage: 'Please enter a valid 10-digit mobile number.' });
        }
        return res.redirect('/contact?error=phone');
    }

    const deptName = body.department || body.department_name || '';
    let msg = (body.message || body.query || '').trim();
    if (!msg && deptName) {
        msg = `Callback request regarding ${deptName}`;
    } else if (!msg) {
        msg = 'General callback request';
    }

    const enquiry = db.createEnquiry({
        name: body.name || body.fname || 'Website Visitor',
        phone: cleanPhone,
        email: (body.email || '').trim(),
        department: deptName,
        message: msg,
        source: body.source || (body.email ? 'Contact Us Page' : 'Callback Modal'),
        status: 'New'
    });

    console.log(`[Lead Captured] ID: #${enquiry.id} | Name: ${enquiry.name} | Phone: ${enquiry.phone} | Dept: ${enquiry.department} | Source: ${enquiry.source}`);

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json')) || req.path.includes('form-sub')) {
        return res.json({
            rettype: 'success',
            status: 'success',
            success: true,
            retmessage: 'Callback request registered successfully',
            enquiryId: enquiry.id
        });
    }

    res.redirect('/thank-you-for-enquiry');
};

app.post('/form-sub/enquiry_submit.php', upload.none(), handleEnquirySubmission);
app.post('/form-sub/contact_submit.php', upload.none(), handleEnquirySubmission);
app.post('/contact', upload.none(), handleEnquirySubmission);

// Fallback for direct POST /book-an-appointment (e.g. from callback forms)
app.post('/book-an-appointment', upload.none(), (req, res) => {
    const body = req.body || {};
    if (body.phone) {
        db.createEnquiry({
            name: body.name || 'Website Visitor',
            phone: body.phone,
            department: body.department || '',
            message: body.message || (body.department ? `Appointment callback request for ${body.department}` : 'Appointment callback request'),
            source: 'Book an Appointment Form',
            status: 'New'
        });
        return res.redirect('/thank-you-for-appointment');
    }
    res.redirect('/book-an-appointment');
});

// Live Search Suggestions Autocomplete (AJAX)
app.get('/form-sub/search_suggestions.php', (req, res) => {
    const keyword = (req.query.keyword || '').toLowerCase().trim();
    if (!keyword) {
        return res.json({ Doctors: [], Departments: [] });
    }

    // Match departments
    const matchedDepts = visibleDepartments()
        .filter(d => d.name.toLowerCase().includes(keyword) || d.slug.includes(keyword))
        .map(d => ({
            phrase: d.name,
            hrefurl: `/${d.slug}`
        }));

    // Match doctors
    const matchedDocs = db.getDoctors()
        .filter(d => d.name.toLowerCase().includes(keyword) || (d.speciality && d.speciality.toLowerCase().includes(keyword)))
        .map(d => ({
            display_name: d.name,
            title: d.slug,
            hrefurl: `/doctor/${d.slug}`,
            image_url: d.image ? (d.image.startsWith('http') ? d.image : d.image) : '/img/about-img.png',
            rating: '',
            speciality: d.speciality
        }));

    res.json({
        Departments: matchedDepts,
        Doctors: matchedDocs
    });
});

// ==========================================
// ADMIN CMS ROUTES
// ==========================================

// Login page
app.get('/admin/login', (req, res) => {
    if (req.session && req.session.adminUser) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const admin = db.authenticateAdmin(username, password);
    if (admin) {
        req.session.adminUser = { id: admin.id, name: admin.name, username: admin.username, role: admin.role };
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: 'Invalid username or password' });
});

app.get('/admin/logout', (req, res) => {
    req.session = null;
    res.redirect('/admin/login');
});

// Admin Dashboard
app.get('/admin', requireAdmin, (req, res) => {
    const allAppointments = db.getAppointments();
    const allEnquiries = db.getEnquiries();
    const stats = {
        totalAppointments: allAppointments.length,
        newAppointments: allAppointments.filter(a => a.status === 'New').length,
        totalEnquiries: allEnquiries.length,
        newEnquiries: allEnquiries.filter(e => e.status === 'New').length,
        totalDoctors: db.getDoctors().length,
        totalDepartments: db.getDepartments().length
    };
    const recentAppointments = allAppointments.slice(0, 6);
    const recentEnquiries = allEnquiries.slice(0, 6);

    renderAdmin(res, 'dashboard', {
        activeTab: 'dashboard',
        pageHeading: 'Hospital Management Dashboard',
        stats,
        recentAppointments,
        recentEnquiries
    });
});

// Appointments Manager
app.get('/admin/appointments', requireAdmin, (req, res) => {
    const { status, search } = req.query;
    const appointments = db.getAppointments({ status, search });
    renderAdmin(res, 'appointments', {
        activeTab: 'appointments',
        pageHeading: 'OPD Appointments Management',
        appointments,
        query: req.query
    });
});

app.post('/admin/appointments/:id/status', requireAdmin, (req, res) => {
    db.updateAppointmentStatus(req.params.id, req.body.status);
    res.redirect('back');
});

app.post('/admin/appointments/:id/notes', requireAdmin, (req, res) => {
    const appt = db.getAppointmentById(req.params.id);
    if (appt) {
        db.updateAppointmentStatus(req.params.id, appt.status, req.body.notes);
    }
    res.redirect('back');
});

app.post('/admin/appointments/:id/delete', requireAdmin, (req, res) => {
    db.deleteAppointment(req.params.id);
    res.redirect('/admin/appointments');
});

// Enquiries Manager
app.get('/admin/enquiries', requireAdmin, (req, res) => {
    const { status, search } = req.query;
    const enquiries = db.getEnquiries({ status, search });
    renderAdmin(res, 'enquiries', {
        activeTab: 'enquiries',
        pageHeading: 'Callbacks & Patient Enquiries',
        enquiries,
        query: req.query
    });
});

app.post('/admin/enquiries/:id/status', requireAdmin, (req, res) => {
    db.updateEnquiryStatus(req.params.id, req.body.status);
    res.redirect('back');
});

app.post('/admin/enquiries/:id/delete', requireAdmin, (req, res) => {
    db.deleteEnquiry(req.params.id);
    res.redirect('/admin/enquiries');
});

// Doctors CRUD
app.get('/admin/doctors', requireAdmin, (req, res) => {
    const doctors = db.getDoctors();
    renderAdmin(res, 'doctors', {
        activeTab: 'doctors',
        pageHeading: 'Specialist Doctors & Medical Faculty',
        doctors
    });
});

app.get('/admin/doctors/new', requireAdmin, (req, res) => {
    renderAdmin(res, 'doctor-form', {
        activeTab: 'doctors',
        pageHeading: 'Add New Doctor',
        isEdit: false,
        doctor: {}
    });
});

app.post('/admin/doctors/new', requireAdmin, (req, res) => {
    db.saveDoctor(req.body);
    res.redirect('/admin/doctors');
});

app.get('/admin/doctors/:id/edit', requireAdmin, (req, res) => {
    const doctor = db.getDoctorById(req.params.id);
    if (!doctor) return res.redirect('/admin/doctors');
    renderAdmin(res, 'doctor-form', {
        activeTab: 'doctors',
        pageHeading: 'Edit Doctor: ' + doctor.name,
        isEdit: true,
        doctor
    });
});

app.post('/admin/doctors/:id/edit', requireAdmin, (req, res) => {
    db.saveDoctor({ id: req.params.id, ...req.body });
    res.redirect('/admin/doctors');
});

app.post('/admin/doctors/:id/delete', requireAdmin, (req, res) => {
    db.deleteDoctor(req.params.id);
    res.redirect('/admin/doctors');
});

// Clinical Services CRUD
app.get('/admin/services', requireAdmin, (req, res) => {
    const departments = db.getDepartments();
    renderAdmin(res, 'services', {
        activeTab: 'services',
        pageHeading: 'Clinical Services & Departments',
        departments
    });
});

app.get('/admin/services/new', requireAdmin, (req, res) => {
    renderAdmin(res, 'service-form', {
        activeTab: 'services',
        pageHeading: 'Add Clinical Service',
        isEdit: false,
        department: {}
    });
});

app.post('/admin/services/new', requireAdmin, (req, res) => {
    db.saveDepartment(req.body);
    res.redirect('/admin/services');
});

app.get('/admin/services/:id/edit', requireAdmin, (req, res) => {
    const dept = db.getDepartments().find(d => d.id == req.params.id);
    if (!dept) return res.redirect('/admin/services');
    renderAdmin(res, 'service-form', {
        activeTab: 'services',
        pageHeading: 'Edit Service: ' + dept.name,
        isEdit: true,
        department: dept
    });
});

app.post('/admin/services/:id/edit', requireAdmin, (req, res) => {
    db.saveDepartment({ id: req.params.id, ...req.body });
    res.redirect('/admin/services');
});

app.post('/admin/services/:id/delete', requireAdmin, (req, res) => {
    db.deleteDepartment(req.params.id);
    res.redirect('/admin/services');
});

// Blogs CRUD
app.get('/admin/blogs', requireAdmin, (req, res) => {
    const blogs = db.getBlogs();
    renderAdmin(res, 'blogs', {
        activeTab: 'blogs',
        pageHeading: 'Health Articles & Blog Posts',
        blogs
    });
});

app.get('/admin/blogs/new', requireAdmin, (req, res) => {
    renderAdmin(res, 'blog-form', {
        activeTab: 'blogs',
        pageHeading: 'Write New Health Article',
        isEdit: false,
        blog: {}
    });
});

app.post('/admin/blogs/new', requireAdmin, (req, res) => {
    db.saveBlog(req.body);
    res.redirect('/admin/blogs');
});

app.get('/admin/blogs/:id/edit', requireAdmin, (req, res) => {
    const blog = db.getBlogs().find(b => b.id == req.params.id);
    if (!blog) return res.redirect('/admin/blogs');
    renderAdmin(res, 'blog-form', {
        activeTab: 'blogs',
        pageHeading: 'Edit Article: ' + blog.title,
        isEdit: true,
        blog
    });
});

app.post('/admin/blogs/:id/edit', requireAdmin, (req, res) => {
    db.saveBlog({ id: req.params.id, ...req.body });
    res.redirect('/admin/blogs');
});

app.post('/admin/blogs/:id/delete', requireAdmin, (req, res) => {
    db.deleteBlog(req.params.id);
    res.redirect('/admin/blogs');
});

// Global Site Settings
app.get('/admin/settings', requireAdmin, (req, res) => {
    renderAdmin(res, 'settings', {
        activeTab: 'settings',
        pageHeading: 'Hospital Global Settings',
        success: req.query.saved === '1'
    });
});

app.post('/admin/settings', requireAdmin, (req, res) => {
    const body = req.body;
    db.updateSiteInfo({
        hospitalName: body.hospitalName,
        email: body.email,
        address: body.address,
        hospitalCentre: body.hospitalCentre,
        siteUrl: body.siteUrl,
        mapEmbedUrl: body.mapEmbedUrl,
        appointmentNumberDisplay: body.appointmentNumberDisplay,
        emergencyNumbers: [body.emergency1, body.emergency2],
        appointmentNumber: body.appointmentNumber,
        opdEnquiriesNumber: body.opdEnquiriesNumber,
        whatsappNumber: body.whatsappNumber,
        socialLinks: {
            instagram: body.instagram,
            facebook: body.facebook,
            linkedin: body.linkedin,
            youtube: body.youtube,
            twitter: body.twitter || ''
        }
    });
    res.redirect('/admin/settings?saved=1');
});

// ==========================================
// WEBSITE PAGE MANAGEMENT & CONTENT OPTIMIZATION CMS
// ==========================================

// 1. Pages Inventory List (Search, Filter, Pagination, Stats)
app.get('/admin/pages', requireAdmin, (req, res) => {
    const { search, category, type, status, sort, page: pageNum, limit: limitNum } = req.query;
    const page = parseInt(pageNum, 10) || 1;
    const limit = parseInt(limitNum, 10) || 15;

    // Fetch filtered list
    const allFiltered = db.getPages({
        search,
        category,
        type,
        status: status || 'active',
        sort: sort || 'modified_desc'
    });

    const totalFilteredCount = allFiltered.length;
    const totalPages = Math.ceil(totalFilteredCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedPages = allFiltered.slice(startIndex, startIndex + limit);

    renderAdmin(res, 'pages', {
        activeTab: 'pages',
        pageHeading: 'Website Page Management & Content Optimization',
        pages: paginatedPages,
        stats: db.getPageStats(),
        categories: db.getCategories(),
        currentFilters: { search, category, type, status, sort },
        totalFilteredCount,
        pagination: {
            page,
            limit,
            totalPages
        },
        message: req.query.saved ? 'Page saved and updated successfully.' : (req.query.bulk ? `Bulk operation applied to ${req.query.bulk} page(s).` : null),
        messageType: 'success'
    });
});

// 2. New Page Form
app.get('/admin/pages/new', requireAdmin, (req, res) => {
    renderAdmin(res, 'page-editor', {
        activeTab: 'pages',
        pageHeading: 'Create New Website Page',
        isEdit: false,
        page: {},
        categories: db.getCategories()
    });
});

// 3. Edit Page Form
app.get('/admin/pages/edit/:id', requireAdmin, (req, res) => {
    const page = db.getPageById(req.params.id);
    if (!page) return res.redirect('/admin/pages');
    renderAdmin(res, 'page-editor', {
        activeTab: 'pages',
        pageHeading: 'Edit Page: ' + page.title,
        isEdit: true,
        page,
        categories: db.getCategories(),
        query: req.query
    });
});

// 4. Save / Update Page
app.post('/admin/pages/save', requireAdmin, pageUpload.single('heroUpload'), (req, res) => {
    const body = req.body;
    let heroImageUrl = body.heroImage;
    if (req.file) {
        heroImageUrl = `/upload/pages/${req.file.filename}`;
    }

    const saved = db.savePage({
        id: body.id,
        title: body.title,
        slug: body.slug,
        url: body.url,
        category: body.category,
        type: body.type,
        status: body.status || 'published',
        thumbnail: body.thumbnail || heroImageUrl,
        heroImage: heroImageUrl,
        heading: body.heading,
        subheading: body.subheading,
        content: body.content,
        ctaText: body.ctaText,
        ctaLink: body.ctaLink,
        altText: body.altText,
        seoTitle: body.seoTitle,
        metaDescription: body.metaDescription,
        canonicalUrl: body.canonicalUrl,
        indexing: body.indexing,
        lastModifiedBy: req.session.adminUser ? req.session.adminUser.name : 'Hospital Administrator',
        changeNote: body.changeNote || (body.id ? 'Updated via page editor' : 'New page created')
    });

    if (body.id) {
        res.redirect(`/admin/pages/edit/${body.id}?saved=1`);
    } else {
        res.redirect(`/admin/pages?saved=1`);
    }
});

// 5. Soft-Trash Page
app.post('/admin/pages/trash/:id', requireAdmin, (req, res) => {
    db.trashPage(req.params.id);
    res.redirect('back');
});

// 6. Restore Page from Trash
app.post('/admin/pages/restore/:id', requireAdmin, (req, res) => {
    db.restorePage(req.params.id);
    res.redirect('back');
});

// 7. Delete Permanently
app.post('/admin/pages/delete/:id', requireAdmin, (req, res) => {
    db.deletePagePermanent(req.params.id);
    res.redirect('/admin/pages?status=trashed');
});

// 8. Clone Page into Draft
app.post('/admin/pages/clone/:id', requireAdmin, (req, res) => {
    const clone = db.clonePage(req.params.id);
    if (clone) {
        res.redirect(`/admin/pages/edit/${clone.id}?cloned=1`);
    } else {
        res.redirect('/admin/pages');
    }
});

// 9. Rewrite & Republish Workspace
app.get('/admin/pages/rewrite/:id', requireAdmin, (req, res) => {
    const page = db.getPageById(req.params.id);
    if (!page) return res.redirect('/admin/pages');
    renderAdmin(res, 'page-rewrite', {
        activeTab: 'pages',
        pageHeading: 'Rewrite & Republish: ' + page.title,
        page
    });
});

app.post('/admin/pages/rewrite/:id', requireAdmin, (req, res) => {
    const page = db.rewriteRepublishPage(req.params.id, {
        title: req.body.title,
        heading: req.body.heading,
        content: req.body.content,
        seoTitle: req.body.seoTitle,
        metaDescription: req.body.metaDescription,
        altText: req.body.altText,
        ctaText: req.body.ctaText,
        ctaLink: req.body.ctaLink,
        status: req.body.status || 'published',
        note: req.body.note || 'Optimized via Rewrite & Republish workspace'
    });
    res.redirect(`/admin/pages/edit/${req.params.id}?saved=1`);
});

// 10. Bulk Actions
app.post('/admin/pages/bulk', requireAdmin, (req, res) => {
    const { action, ids, category } = req.body;
    const pageIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
    const count = db.bulkUpdatePages(pageIds, action, { category });
    res.redirect(`/admin/pages?bulk=${count}`);
});

// 11. Export Inventory (CSV or JSON)
app.get('/admin/pages/export', requireAdmin, (req, res) => {
    const format = req.query.format || 'json';
    const pages = db.getPages({ status: 'all' });

    if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="neotia_pages_inventory.csv"');
        let csv = 'ID,Title,URL,Slug,Category,Type,Status,SEO Title,Meta Description,Last Modified,Last Modified By\n';
        pages.forEach(p => {
            const clean = str => `"${(str || '').replace(/"/g, '""')}"`;
            csv += [
                p.id,
                clean(p.title),
                clean(p.url),
                clean(p.slug),
                clean(p.category),
                clean(p.type),
                clean(p.status),
                clean(p.seoTitle),
                clean(p.metaDescription),
                clean(p.lastModified),
                clean(p.lastModifiedBy)
            ].join(',') + '\n';
        });
        return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="neotia_pages_inventory.json"');
    res.send(JSON.stringify(pages, null, 2));
});

// 12. Add Category API
app.post('/admin/pages/api/category', requireAdmin, (req, res) => {
    const { name } = req.body;
    const added = db.addCategory(name);
    res.json({ success: added });
});

// Dynamic speciality route (e.g. /obstetrics-gynaecology). Hidden specialities 404.
app.get('/:serviceSlug', (req, res, next) => {
    if (isHiddenDepartment(req.params.serviceSlug)) {
        return res.status(404).render('404');
    }
    const dept = visibleDepartmentBySlug(req.params.serviceSlug);
    if (!dept) {
        return next();
    }
    const specialityDoctors = doctorsForDepartment(dept);
    // Doctor dropdown of the booking form at the top of the page (views/partials/speciality-booking.ejs):
    // only the doctors matched to this speciality (none -> just "Any Doctor"), the same list
    // /form-sub/get_doctors.php returns with matched_only=1
    const bookingDoctors = matchedDoctors(dept.name);

    // Check if custom view exists for this service (e.g., paediatric-cardiac-science.ejs)
    const specificView = path.join(__dirname, 'views', `${req.params.serviceSlug}.ejs`);
    if (fs.existsSync(specificView)) {
        return res.render(req.params.serviceSlug, {
            department: dept,
            specialityDoctors,
            bookingDoctors
        });
    }

    res.render('service-detail', {
        department: dept,
        specialityDoctors,
        bookingDoctors
    });
});

// Dynamic CMS page handler for custom created/cloned pages that don't have dedicated routes
app.get('/:slug', (req, res, next) => {
    const page = db.getPageBySlug(req.params.slug);
    if (!page) {
        return next();
    }
    // Check publication status
    const isAdmin = req.session && req.session.adminUser;
    const isPreview = req.query.preview === 'admin' || req.query.preview === '1';
    if (page.status === 'trashed') {
        return res.status(404).render('404');
    }
    if (page.status === 'draft' && (!isAdmin || !isPreview)) {
        return res.status(404).render('404');
    }

    // Check if view with this slug exists
    const viewFile = path.join(__dirname, 'views', `${page.slug}.ejs`);
    if (fs.existsSync(viewFile)) {
        return res.render(page.slug, { page });
    }
    // Otherwise render standard dynamic page view
    res.render('service-detail', {
        page,
        department: {
            name: page.title,
            slug: page.slug,
            description: page.content,
            overview: page.content,
            highlights: []
        },
        specialityDoctors: []
    });
});

// 404 Fallback
app.use((req, res) => {
    res.status(404).render('404');
});

// Error handler: full details go to the server log only, visitors get a plain 500 page
app.use((err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl}`, err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500);
    // Errors raised before the locals middleware (e.g. a malformed request body) still need the layout data
    try {
        res.locals.siteInfo = res.locals.siteInfo || db.getSiteInfo();
        res.locals.departments = res.locals.departments || visibleDepartments();
        res.locals.doctors = res.locals.doctors || db.getDoctors();
    } catch (localsErr) {
        console.error('[Error] could not load layout data for the error page', localsErr);
    }
    res.locals.currentLang = res.locals.currentLang || 'en';
    res.locals.currentPath = res.locals.currentPath || req.path;
    res.render('500', (renderErr, html) => {
        if (renderErr) {
            console.error('[Error] 500 page failed to render', renderErr);
            return res.type('text').send('Something went wrong. Please try again later.');
        }
        res.send(html);
    });
});

// Start the server locally. On Vercel the platform imports the exported app instead.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Neotia Bhagirathi Hospital Server running live at: http://localhost:${PORT}`);
        console.log(`Admin CMS Portal: http://localhost:${PORT}/admin (log in with ADMIN_USERNAME / ADMIN_PASSWORD from .env)`);
        if (PREVIEW_MODE) console.log('Preview mode is ON: read-only, nothing is saved, pages are noindex.');
    });
}

module.exports = app;
