const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// data/database.json is the live store (git-ignored). On a fresh clone it doesn't exist yet,
// so it is created from data/database.seed.json: site content only, no leads and no accounts.
const DB_FILE = path.join(__dirname, 'data', 'database.json');
const SEED_FILE = path.join(__dirname, 'data', 'database.seed.json');

// Preview mode (Vercel review link, or PREVIEW_MODE=true): read-only. The seed is loaded into memory,
// nothing is ever written to disk, and form submissions are logged instead of stored.
const PREVIEW_MODE = !!process.env.VERCEL || process.env.PREVIEW_MODE === 'true';

// PASSWORD_SALT must stay the same once accounts exist, or stored hashes stop matching
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + (process.env.PASSWORD_SALT || '')).digest('hex');
}

class Database {
  constructor() {
    this.data = {
      doctors: [],
      departments: [],
      blogs: [],
      faqs: [],
      appointments: [],
      enquiries: [],
      siteInfo: {},
      pages: [],
      categories: [
        "Homepage",
        "About the Hospital",
        "Departments & Specialities",
        "Doctors & Medical Professionals",
        "Services & Treatments",
        "Patient Information",
        "Appointments & Enquiries",
        "Facilities & Infrastructure",
        "Health Articles & Blogs",
        "News & Updates",
        "Campaign Landing Pages",
        "Contact & Location Pages",
        "Legal & Policy Pages",
        "Other Pages"
      ],
      admins: []
    };
    this.init();
  }

  // First admin account comes from ADMIN_USERNAME / ADMIN_PASSWORD; there is no built-in password
  ensureAdmin() {
    if (this.data.admins && this.data.admins.length > 0) return;
    this.data.admins = [];
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('[Database] No admin account: set ADMIN_PASSWORD (and ADMIN_USERNAME) in .env and restart to create one.');
      return;
    }
    this.data.admins.push({
      id: 1,
      username: process.env.ADMIN_USERNAME || 'admin',
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD),
      name: 'Hospital Administrator',
      role: 'SuperAdmin'
    });
    console.log(`[Database] Created admin account "${this.data.admins[0].username}" from environment settings.`);
  }

  init() {
    if (PREVIEW_MODE) {
      const seed = fs.existsSync(SEED_FILE) ? JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')) : {};
      this.data = { ...this.data, ...seed, appointments: [], enquiries: [], admins: [] };
      this.ensureAdmin();
      this.initPages();
      this.initCategories();
      console.log('[Database] Preview mode: content loaded from data/database.seed.json; nothing will be saved.');
      return;
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        this.ensureAdmin();
        // Ensure pages and categories are initialized
        this.initPages();
        this.initCategories();
        this.save();
        return;
      } catch (e) {
        // Keep the unreadable file instead of overwriting it with the seed
        const keep = DB_FILE.replace(/\.json$/, `.unreadable-${Date.now()}.json`);
        fs.copyFileSync(DB_FILE, keep);
        console.error(`Failed reading existing DB (copied to ${path.basename(keep)}), restoring from seed:`, e);
      }
    }

    // First run: start from the committed seed (Raipur content, empty leads, no accounts)
    if (fs.existsSync(SEED_FILE)) {
      const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
      this.data = { ...this.data, ...seed, appointments: [], enquiries: [], admins: [] };
      console.log('[Database] Created data/database.json from data/database.seed.json');
    } else {
      console.warn('[Database] data/database.seed.json not found: starting with an empty database.');
    }
    this.ensureAdmin();
    this.initPages();
    this.initCategories();
    this.save();
  }

  isPreview() {
    return PREVIEW_MODE;
  }

  save() {
    if (PREVIEW_MODE) return;
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // --- Auth ---
  authenticateAdmin(username, password) {
    const pHash = hashPassword(password);
    return this.data.admins.find(a => a.username === username && a.passwordHash === pHash);
  }

  // --- Doctors ---
  getDoctors(filter = {}) {
    let list = [...this.data.doctors];
    if (filter.speciality) {
      const q = filter.speciality.toLowerCase().trim();
      // Generate keywords from department query (ignore common words like 'and', 'sciences', 'care', 'paediatric')
      const stopWords = ['and', '&', 'sciences', 'science', 'care', 'paediatric', 'department', 'in', 'unit'];
      const keywords = q.split(/[\s,&]+/).filter(w => w.length > 2 && !stopWords.includes(w));

      list = list.filter(d => {
        const docSpec = (d.speciality || '').toLowerCase();
        const docName = (d.name || '').toLowerCase();
        const docSlug = (d.slug || '').toLowerCase();
        
        // Direct inclusion
        if (docSpec.includes(q) || docSlug.includes(q)) return true;

        // Keyword matches (e.g. 'cardiac' matches 'cardiology', 'gastroenterology' matches 'gastro')
        for (const kw of keywords) {
          const stem = kw.substring(0, 5);
          if (docSpec.includes(kw) || docSpec.includes(stem)) return true;
        }
        return false;
      });
      // If no exact keyword matched, fallback to all doctors rather than empty dropdown
      if (list.length === 0) {
        list = [...this.data.doctors];
      }
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(d => d.name.toLowerCase().includes(q) || (d.speciality && d.speciality.toLowerCase().includes(q)));
    }
    return list;
  }

  getDoctorBySlug(slug) {
    return this.data.doctors.find(d => d.slug === slug);
  }

  getDoctorById(id) {
    return this.data.doctors.find(d => d.id == id);
  }

  saveDoctor(doc) {
    if (doc.id) {
      const idx = this.data.doctors.findIndex(d => d.id == doc.id);
      if (idx !== -1) {
        this.data.doctors[idx] = { ...this.data.doctors[idx], ...doc };
        this.save();
        return this.data.doctors[idx];
      }
    }
    doc.id = this.data.doctors.length ? Math.max(...this.data.doctors.map(d => d.id)) + 1 : 1;
    if (!doc.slug) doc.slug = doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.data.doctors.push(doc);
    this.save();
    return doc;
  }

  deleteDoctor(id) {
    this.data.doctors = this.data.doctors.filter(d => d.id != id);
    this.save();
  }

  // --- Departments ---
  getDepartments() {
    return this.data.departments;
  }

  getDepartmentBySlug(slug) {
    return this.data.departments.find(d => d.slug === slug);
  }

  saveDepartment(dept) {
    if (dept.id) {
      const idx = this.data.departments.findIndex(d => d.id == dept.id);
      if (idx !== -1) {
        this.data.departments[idx] = { ...this.data.departments[idx], ...dept };
        this.save();
        return this.data.departments[idx];
      }
    }
    dept.id = this.data.departments.length ? Math.max(...this.data.departments.map(d => d.id)) + 1 : 1;
    if (!dept.slug) dept.slug = dept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.data.departments.push(dept);
    this.save();
    return dept;
  }

  deleteDepartment(id) {
    this.data.departments = this.data.departments.filter(d => d.id != id);
    this.save();
  }

  // --- Blogs ---
  getBlogs() {
    return this.data.blogs;
  }

  getBlogBySlug(slug) {
    return this.data.blogs.find(b => b.slug === slug);
  }

  saveBlog(blog) {
    if (blog.id) {
      const idx = this.data.blogs.findIndex(b => b.id == blog.id);
      if (idx !== -1) {
        this.data.blogs[idx] = { ...this.data.blogs[idx], ...blog };
        this.save();
        return this.data.blogs[idx];
      }
    }
    blog.id = this.data.blogs.length ? Math.max(...this.data.blogs.map(b => b.id)) + 1 : 1;
    if (!blog.slug) blog.slug = blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.data.blogs.push(blog);
    this.save();
    return blog;
  }

  deleteBlog(id) {
    this.data.blogs = this.data.blogs.filter(b => b.id != id);
    this.save();
  }

  // --- Appointments ---
  getAppointments(filter = {}) {
    let list = [...this.data.appointments];
    if (filter.status && filter.status !== 'All') {
      list = list.filter(a => a.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(a => 
        (a.name && a.name.toLowerCase().includes(q)) || 
        (a.phone && a.phone.includes(q)) ||
        (a.doctor_name && a.doctor_name.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getAppointmentById(id) {
    return this.data.appointments.find(a => a.id == id);
  }

  createAppointment(appt) {
    if (PREVIEW_MODE) {
      // Same response shape as a real booking, but nothing is stored
      const preview = { ...appt, id: Date.now(), status: 'New', createdAt: new Date().toISOString() };
      console.log('[Preview mode] Appointment not saved:', JSON.stringify(preview));
      return preview;
    }
    appt.id = this.data.appointments.length ? Math.max(...this.data.appointments.map(a => a.id)) + 1 : 1;
    appt.status = appt.status || 'New';
    appt.createdAt = new Date().toISOString();
    this.data.appointments.unshift(appt);
    this.save();
    return appt;
  }

  updateAppointmentStatus(id, status, notes = '') {
    const appt = this.getAppointmentById(id);
    if (appt) {
      appt.status = status;
      if (notes !== undefined) appt.notes = notes;
      this.save();
      return appt;
    }
    return null;
  }

  deleteAppointment(id) {
    this.data.appointments = this.data.appointments.filter(a => a.id != id);
    this.save();
  }

  // --- Enquiries / Callbacks ---
  getEnquiries(filter = {}) {
    let list = [...this.data.enquiries];
    if (filter.status && filter.status !== 'All') {
      list = list.filter(e => e.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(e => 
        (e.name && e.name.toLowerCase().includes(q)) || 
        (e.phone && e.phone.includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.message && e.message.toLowerCase().includes(q)) ||
        (e.source && e.source.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createEnquiry(enq) {
    if (PREVIEW_MODE) {
      const preview = { ...enq, id: Date.now(), status: 'New', createdAt: new Date().toISOString() };
      console.log('[Preview mode] Enquiry not saved:', JSON.stringify(preview));
      return preview;
    }
    enq.id = this.data.enquiries.length ? Math.max(...this.data.enquiries.map(e => e.id)) + 1 : 1;
    enq.status = enq.status || 'New';
    enq.createdAt = new Date().toISOString();
    this.data.enquiries.unshift(enq);
    this.save();
    return enq;
  }

  updateEnquiryStatus(id, status, notes = '') {
    const enq = this.data.enquiries.find(e => e.id == id);
    if (enq) {
      enq.status = status;
      if (notes !== undefined) enq.notes = notes;
      this.save();
      return enq;
    }
    return null;
  }

  deleteEnquiry(id) {
    this.data.enquiries = this.data.enquiries.filter(e => e.id != id);
    this.save();
  }

  // --- Site Info ---
  getSiteInfo() {
    return this.data.siteInfo;
  }

  updateSiteInfo(info) {
    this.data.siteInfo = { ...this.data.siteInfo, ...info };
    this.save();
    return this.data.siteInfo;
  }

  // --- FAQs ---
  getFaqs() {
    return this.data.faqs;
  }

  // --- Page Management & CMS ---
  initPages() {
    if (!Array.isArray(this.data.pages)) {
      this.data.pages = [];
    }
  }

  initCategories() {
    const defaultCategories = [
      "Homepage",
      "About the Hospital",
      "Departments & Specialities",
      "Doctors & Medical Professionals",
      "Services & Treatments",
      "Patient Information",
      "Appointments & Enquiries",
      "Facilities & Infrastructure",
      "Health Articles & Blogs",
      "News & Updates",
      "Campaign Landing Pages",
      "Contact & Location Pages",
      "Legal & Policy Pages",
      "Other Pages"
    ];

    if (!this.data.categories || this.data.categories.length === 0) {
      this.data.categories = defaultCategories;
    } else {
      // Ensure all standard categories exist
      defaultCategories.forEach(cat => {
        if (!this.data.categories.includes(cat)) {
          this.data.categories.push(cat);
        }
      });
    }
  }

  getCategories() {
    return this.data.categories || [];
  }

  addCategory(name) {
    if (!name) return false;
    const trimmed = name.trim();
    if (!this.data.categories) this.data.categories = [];
    if (!this.data.categories.includes(trimmed)) {
      this.data.categories.push(trimmed);
      this.save();
      return true;
    }
    return false;
  }

  getPageStats() {
    const pages = this.data.pages || [];
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    return {
      total: pages.filter(p => p.status !== 'trashed').length,
      allIncludingTrashed: pages.length,
      published: pages.filter(p => p.status === 'published').length,
      draft: pages.filter(p => p.status === 'draft').length,
      trashed: pages.filter(p => p.status === 'trashed').length,
      scheduled: pages.filter(p => p.status === 'scheduled').length,
      recentlyUpdated: pages.filter(p => {
        const d = new Date(p.lastModified).getTime();
        return !isNaN(d) && d >= sevenDaysAgo;
      }).length
    };
  }

  getPages(filter = {}) {
    let list = [...(this.data.pages || [])];

    // Status filter
    if (filter.status === 'active' || !filter.status) {
      // By default, exclude trashed pages unless explicitly viewing trashed or all
      list = list.filter(p => p.status !== 'trashed');
    } else if (filter.status !== 'all') {
      list = list.filter(p => p.status === filter.status);
    }

    // Category filter
    if (filter.category && filter.category !== 'all' && filter.category !== 'All Categories') {
      list = list.filter(p => p.category === filter.category);
    }

    // Type filter
    if (filter.type && filter.type !== 'all' && filter.type !== 'All Types') {
      list = list.filter(p => p.type === filter.type);
    }

    // Keyword search
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q)) ||
        (p.url && p.url.toLowerCase().includes(q)) ||
        (p.seoTitle && p.seoTitle.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.id && String(p.id) === q)
      );
    }

    // Sort order
    const sort = filter.sort || 'modified_desc';
    if (sort === 'modified_desc') {
      list.sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0));
    } else if (sort === 'modified_asc') {
      list.sort((a, b) => new Date(a.lastModified || 0) - new Date(b.lastModified || 0));
    } else if (sort === 'title_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sort === 'title_desc') {
      list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    }

    return list;
  }

  getPageById(id) {
    return (this.data.pages || []).find(p => p.id == id);
  }

  getPageBySlug(slug) {
    if (!slug) return null;
    const clean = slug.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (clean === 'homepage' || clean === '' || clean === 'home') {
      return (this.data.pages || []).find(p => p.id == 1 || p.slug === 'homepage' || p.url === '/');
    }
    return (this.data.pages || []).find(p => (p.slug || '').toLowerCase() === clean);
  }

  getPageByUrl(url) {
    if (!url) return null;
    // Normalize url: e.g. "/contact/" -> "/contact", "/" -> "/"
    const normalized = url === '/' ? '/' : url.replace(/\/+$/, '');
    if (normalized === '/') {
      return (this.data.pages || []).find(p => p.url === '/' || p.slug === 'homepage' || p.id == 1);
    }
    return (this.data.pages || []).find(p => {
      const pageUrl = p.url === '/' ? '/' : (p.url || ('/' + (p.slug || ''))).replace(/\/+$/, '');
      return pageUrl.toLowerCase() === normalized.toLowerCase();
    });
  }

  savePage(pageData) {
    let page;

    // Normalize status if passed as array or composite string
    let status = pageData.status;
    if (Array.isArray(status)) {
      status = status[status.length - 1];
    }
    if (typeof status === 'string' && status.includes(',')) {
      status = status.split(',').pop().trim();
    }
    if (!status) status = 'published';
    pageData.status = status;

    // Normalize URL and slug for Homepage and other pages
    if (pageData.id == 1 || pageData.slug === 'homepage' || pageData.url === '/') {
      pageData.url = '/';
      pageData.slug = 'homepage';
    } else if (pageData.slug) {
      const cleanSlug = pageData.slug.replace(/^\/+|\/+$/g, '').toLowerCase();
      pageData.slug = cleanSlug;
      if (!pageData.url) {
        pageData.url = `/${cleanSlug}`;
      }
    }

    if (pageData.id) {
      const idx = (this.data.pages || []).findIndex(p => p.id == pageData.id);
      if (idx !== -1) {
        page = this.data.pages[idx];
        // Create revision snapshot before modifying
        if (!page.revisions) page.revisions = [];
        page.revisions.unshift({
          timestamp: new Date().toISOString(),
          author: pageData.lastModifiedBy || 'Hospital Administrator',
          title: page.title,
          heading: page.heading,
          content: page.content,
          seoTitle: page.seoTitle,
          metaDescription: page.metaDescription,
          status: pageData.status,
          note: pageData.changeNote || 'Standard page update'
        });
        if (page.revisions.length > 20) page.revisions = page.revisions.slice(0, 20);

        // Update fields
        this.data.pages[idx] = {
          ...page,
          ...pageData,
          id: page.id, // Preserve integer ID
          url: (page.id == 1 || page.slug === 'homepage' || pageData.url === '/') ? '/' : (pageData.url || page.url || `/${page.slug}`),
          isSystem: page.isSystem !== undefined ? page.isSystem : false,
          lastModified: new Date().toISOString(),
          lastModifiedBy: pageData.lastModifiedBy || 'Hospital Administrator'
        };
        this.save();
        return this.data.pages[idx];
      }
    }

    // Create New Page
    const newId = (this.data.pages || []).length ? Math.max(...this.data.pages.map(p => Number(p.id) || 0)) + 1 : 1;
    let baseSlug = pageData.slug || (pageData.title || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let uniqueSlug = baseSlug;
    let count = 1;
    while ((this.data.pages || []).some(p => p.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }

    page = {
      id: newId,
      slug: uniqueSlug,
      title: pageData.title || 'Untitled Page',
      url: pageData.url || `/${uniqueSlug}`,
      category: pageData.category || 'Other Pages',
      type: pageData.type || 'Core Page',
      status: pageData.status || 'draft',
      thumbnail: pageData.thumbnail || '/img/about-img.png',
      heroImage: pageData.heroImage || '/img/about-img.png',
      seoTitle: pageData.seoTitle || pageData.title || '',
      metaDescription: pageData.metaDescription || '',
      canonicalUrl: pageData.canonicalUrl || `/${uniqueSlug}`,
      heading: pageData.heading || pageData.title || '',
      subheading: pageData.subheading || '',
      content: pageData.content || '',
      ctaText: pageData.ctaText || 'Contact Us',
      ctaLink: pageData.ctaLink || '/contact',
      altText: pageData.altText || pageData.title || '',
      indexing: pageData.indexing || 'index, follow',
      lastModified: new Date().toISOString(),
      publishedAt: pageData.status === 'published' ? new Date().toISOString() : null,
      lastModifiedBy: pageData.lastModifiedBy || 'Hospital Administrator',
      isSystem: false,
      revisions: []
    };

    if (!this.data.pages) this.data.pages = [];
    this.data.pages.push(page);
    this.save();
    return page;
  }

  trashPage(id) {
    const page = this.getPageById(id);
    if (!page) return null;
    page.previousStatus = page.status;
    page.status = 'trashed';
    page.trashedAt = new Date().toISOString();
    page.lastModified = new Date().toISOString();
    this.save();
    return page;
  }

  restorePage(id) {
    const page = this.getPageById(id);
    if (!page) return null;
    page.status = page.previousStatus && page.previousStatus !== 'trashed' ? page.previousStatus : 'published';
    delete page.trashedAt;
    delete page.previousStatus;
    page.lastModified = new Date().toISOString();
    this.save();
    return page;
  }

  deletePagePermanent(id) {
    const initialLen = (this.data.pages || []).length;
    this.data.pages = (this.data.pages || []).filter(p => p.id != id);
    if (this.data.pages.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  clonePage(id) {
    const original = this.getPageById(id);
    if (!original) return null;

    const newId = (this.data.pages || []).length ? Math.max(...this.data.pages.map(p => Number(p.id) || 0)) + 1 : 1;
    const cloneSlug = `${original.slug}-copy-${Math.floor(1000 + Math.random() * 9000)}`;

    const cloned = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      slug: cloneSlug,
      title: `${original.title} (Clone)`,
      url: `/${cloneSlug}`,
      status: 'draft',
      isSystem: false,
      canonicalUrl: `/${cloneSlug}`,
      lastModified: new Date().toISOString(),
      publishedAt: null,
      lastModifiedBy: 'Hospital Administrator',
      revisions: [
        {
          timestamp: new Date().toISOString(),
          author: 'Hospital Administrator',
          title: `${original.title} (Clone)`,
          note: `Cloned from "${original.title}" (ID: ${original.id})`
        }
      ]
    };

    this.data.pages.push(cloned);
    this.save();
    return cloned;
  }

  rewriteRepublishPage(id, rewriteData) {
    const page = this.getPageById(id);
    if (!page) return null;

    if (!page.revisions) page.revisions = [];
    page.revisions.unshift({
      timestamp: new Date().toISOString(),
      author: 'Hospital Administrator',
      title: page.title,
      heading: page.heading,
      content: page.content,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      status: page.status,
      note: rewriteData.note || 'Optimized via Rewrite & Republish workspace'
    });

    if (rewriteData.title) page.title = rewriteData.title;
    if (rewriteData.heading) page.heading = rewriteData.heading;
    if (rewriteData.subheading !== undefined) page.subheading = rewriteData.subheading;
    if (rewriteData.content !== undefined) page.content = rewriteData.content;
    if (rewriteData.seoTitle) page.seoTitle = rewriteData.seoTitle;
    if (rewriteData.metaDescription) page.metaDescription = rewriteData.metaDescription;
    if (rewriteData.ctaText) page.ctaText = rewriteData.ctaText;
    if (rewriteData.ctaLink) page.ctaLink = rewriteData.ctaLink;
    if (rewriteData.altText) page.altText = rewriteData.altText;

    if (rewriteData.status) page.status = rewriteData.status;
    else page.status = 'published';

    page.lastModified = new Date().toISOString();
    page.lastModifiedBy = 'Hospital Administrator';
    this.save();
    return page;
  }

  bulkUpdatePages(ids, action, payload = {}) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const idSet = new Set(ids.map(i => String(i)));
    let updatedCount = 0;

    if (action === 'trash') {
      this.data.pages.forEach(p => {
        if (idSet.has(String(p.id)) && p.status !== 'trashed') {
          p.previousStatus = p.status;
          p.status = 'trashed';
          p.trashedAt = new Date().toISOString();
          p.lastModified = new Date().toISOString();
          updatedCount++;
        }
      });
    } else if (action === 'restore') {
      this.data.pages.forEach(p => {
        if (idSet.has(String(p.id)) && p.status === 'trashed') {
          p.status = p.previousStatus || 'published';
          delete p.trashedAt;
          delete p.previousStatus;
          p.lastModified = new Date().toISOString();
          updatedCount++;
        }
      });
    } else if (action === 'changeCategory') {
      if (payload.category) {
        this.data.pages.forEach(p => {
          if (idSet.has(String(p.id))) {
            p.category = payload.category;
            p.lastModified = new Date().toISOString();
            updatedCount++;
          }
        });
      }
    } else if (action === 'setDraft') {
      this.data.pages.forEach(p => {
        if (idSet.has(String(p.id))) {
          p.status = 'draft';
          p.lastModified = new Date().toISOString();
          updatedCount++;
        }
      });
    } else if (action === 'setPublished') {
      this.data.pages.forEach(p => {
        if (idSet.has(String(p.id))) {
          p.status = 'published';
          p.lastModified = new Date().toISOString();
          updatedCount++;
        }
      });
    } else if (action === 'deletePermanent') {
      const beforeCount = this.data.pages.length;
      this.data.pages = this.data.pages.filter(p => !idSet.has(String(p.id)));
      updatedCount = beforeCount - this.data.pages.length;
    }

    if (updatedCount > 0) {
      this.save();
    }
    return updatedCount;
  }
}

module.exports = new Database();
