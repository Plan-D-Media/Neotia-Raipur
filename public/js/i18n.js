/**
 * Neotia Bhagirathi Hospital - Multilingual Translation System (i18n)
 * Supports: English (en), Hindi (hi)
 * Features:
 * - High-precision curated medical & healthcare terminology
 * - Seamless header language switcher (Desktop & Mobile)
 * - Deep DOM translation across headings, buttons, forms, placeholders & modals
 * - Automated Google Translate bridge for arbitrary long-form content
 * - Complete input & form protection (no values cleared or reset)
 * - Preservation of proper nouns (Doctor names, hospital brand, phones, addresses)
 * - Full persistence across sessions via cookies & localStorage
 */

(function () {
    'use strict';

    // 1. Supported Languages Configuration
    const SUPPORTED_LANGUAGES = {
        'en': { code: 'en', name: 'English', native: 'English', badge: 'EN', font: 'sans-serif' },
        'hi': { code: 'hi', name: 'Hindi', native: 'हिन्दी', badge: 'HI', font: "'Noto Sans Devanagari', 'Hind', sans-serif" }
    };

    // 2. Comprehensive Healthcare & Interface Dictionary
    const DICTIONARY = {
        // Navigation & Top Bar
        'Call Emergency': {
            hi: 'आपातकालीन कॉल',
        },
        'Emergency': {
            hi: 'आपातकालीन',
        },
        'Appointment': {
            hi: 'अपॉइंटमेंट',
        },
        'Book Appointment': {
            hi: 'अपॉइंटमेंट बुक करें',
        },
        'Book An Appointment': {
            hi: 'अपॉइंटमेंट बुक करें',
        },
        'Specialised Services': {
            hi: 'विशेषज्ञ चिकित्सा सेवाएं',
        },
        // Raipur speciality list (sitemap order) and its group tabs
        'Obstetrics & Gynaecology': {
            hi: 'प्रसूति एवं स्त्री रोग',
        },
        'Maternity & Birthing': {
            hi: 'मातृत्व एवं प्रसव',
        },
        'Foetal Medicine': {
            hi: 'भ्रूण चिकित्सा',
        },
        "Women's Health & Gynae-Onco Screening": {
            hi: 'महिला स्वास्थ्य एवं स्त्री-रोग कैंसर जांच',
        },
        'Lactation Support': {
            hi: 'स्तनपान सहायता',
        },
        'Fertility & IVF': {
            hi: 'प्रजनन एवं आईवीएफ',
        },
        'Paediatrics': {
            hi: 'बाल रोग',
        },
        'Neonatology & NICU': {
            hi: 'नवजात शिशु रोग एवं एनआईसीयू',
        },
        'Paediatric Intensive Care (PICU)': {
            hi: 'बाल गहन चिकित्सा (पीआईसीयू)',
        },
        'Vaccination & Immunisation': {
            hi: 'टीकाकरण एवं प्रतिरक्षण',
        },
        'Diagnostics (USG / CT-MRI / Lab)': {
            hi: 'जांच सेवाएं (यूएसजी / सीटी-एमआरआई / लैब)',
        },
        'Child Care': {
            hi: 'शिशु देखभाल',
        },
        'Support': {
            hi: 'सहायक सेवाएं',
        },
        'Details for this speciality will be added soon.': {
            hi: 'इस विशेषज्ञता का विवरण जल्द ही जोड़ा जाएगा।',
        },
        'Find Doctor': {
            hi: 'डॉक्टर खोजें',
        },
        'Find a Doctor': {
            hi: 'डॉक्टर खोजें',
        },
        'Find a Doctor & Medical Faculty Directory': {
            hi: 'डॉक्टर एवं विशेषज्ञ फैकल्टी डायरेक्टरी',
        },
        'Experience': {
            hi: 'अस्पताल अनुभव',
        },
        'Blog': {
            hi: 'स्वास्थ्य लेख एवं ब्लॉग',
        },
        'Contact': {
            hi: 'संपर्क करें',
        },
        'Contact Us': {
            hi: 'हमसे संपर्क करें',
        },
        'Request a Callback': {
            hi: 'कॉलबैक का अनुरोध करें',
        },
        'Request A Callback': {
            hi: 'कॉलबैक का अनुरोध करें',
        },
        'Request Callback Now': {
            hi: 'अभी कॉलबैक का अनुरोध करें',
        },
        'Search For Doctor & Specialties...': {
            hi: 'डॉक्टर या विशेषज्ञता खोजें...',
        },
        'Search': {
            hi: 'खोजें',
        },
        'Specialties': {
            hi: 'विशेषज्ञताएं',
        },

        // Clinical Departments & Super-Specialities
        'Paediatric Cardiac Science': {
            hi: 'पीडियाट्रिक कार्डिएक साइंस (बाल हृदय रोग)',
        },
        'Paediatric Gastroenterology': {
            hi: 'पीडियाट्रिक गैस्ट्रोएंटरोलॉजी (बाल पेट रोग)',
        },
        'Paediatric Neurology': {
            hi: 'पीडियाट्रिक न्यूरोलॉजी (बाल स्नायु रोग)',
        },
        'Paediatric Surgery': {
            hi: 'पीडियाट्रिक सर्जरी (बाल शल्य चिकित्सा)',
        },
        'Paediatric Orthopaedics': {
            hi: 'पीडियाट्रिक ऑर्थोपेडिक्स (बाल हड्डी रोग)',
        },
        'Paediatric Nephrology': {
            hi: 'पीडियाट्रिक नेफ्रोलॉजी (बाल किडनी रोग)',
        },
        'Paediatric Urology': {
            hi: 'पीडियाट्रिक यूरोलॉजी (बाल मूत्र रोग)',
        },
        'Paediatric Endocrinology': {
            hi: 'पीडियाट्रिक एंडोक्रिनोलॉजी (बाल हार्मोन एवं वृद्धि)',
        },
        'Paediatric Medicine': {
            hi: 'पीडियाट्रिक मेडिसिन (बाल सामान्य चिकित्सा)',
        },
        'CT / MRI Scan': {
            hi: 'सीटी एवं एमआरआई स्कैन (उन्नत रेडियोलॉजी)',
        },
        'Neonatal Intensive Care': {
            hi: 'नियोनेटल इंटेंसिव केयर (लेवल 3 एनआईसीयू)',
        },
        'Vaccination and Preventive Care': {
            hi: 'टीकाकरण एवं निवारक स्वास्थ्य सेवा',
        },
        'Paediatric ENT': {
            hi: 'पीडियाट्रिक ईएनटी (बाल कान, नाक, गला)',
        },
        'Paediatric Dentistry': {
            hi: 'पीडियाट्रिक डेंटिस्ट्री (बाल दंत चिकित्सा)',
        },
        'Foetal Medicine and Maternal Care': {
            hi: 'भ्रूण चिकित्सा एवं उच्च जोखिम मातृ देखभाल',
        },
        'Obstetrics and Gynaecology': {
            hi: 'प्रसूति एवं स्त्री रोग विभाग',
        },
        'Fertility and Reproductive Medicine': {
            hi: 'फर्टिलिटी एवं प्रजनन चिकित्सा (आईवीएफ केंद्र)',
        },
        'Cardiac Cath Lab': {
            hi: 'कार्डिएक कैथ लैब (कैथेटराइजेशन प्रयोगशाला)',
        },

        // Homepage & Section Headings
        'Eastern India’s Trusted Name in Child Care': {
            hi: 'पूर्वी भारत में बाल एवं मातृ चिकित्सा का सबसे विश्वसनीय नाम',
        },
        'Leading Paediatric & Woman Super-Speciality Hospital in Kolkata': {
            hi: 'कोलकाता में अग्रणी बाल एवं महिला सुपर-स्पेशियलिटी अस्पताल',
        },
        'Paediatric Care': {
            hi: 'बाल चिकित्सा देखभाल',
        },
        'Woman Care': {
            hi: 'महिला स्वास्थ्य देखभाल',
        },
        'Why Choose Us': {
            hi: 'हमें क्यों चुनें',
        },
        'Key Highlights': {
            hi: 'प्रमुख विशेषताएं',
        },
        'Meet Our Specialists': {
            hi: 'हमारे विशेषज्ञ डॉक्टरों से मिलें',
        },
        'Latest Health Articles': {
            hi: 'नवीनतम स्वास्थ्य एवं चिकित्सा लेख',
        },
        'Frequently Asked Questions': {
            hi: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
        },
        'Patient Stories': {
            hi: 'रोगियों के अनुभव एवं कहानियां',
        },

        // Forms & Modals
        'Your Name *': {
            hi: 'आपका पूरा नाम *',
        },
        'Your Name': {
            hi: 'आपका नाम',
        },
        'Patient Full Name': {
            hi: 'रोगी का पूरा नाम',
        },
        'Patient Full Name *': {
            hi: 'रोगी का पूरा नाम *',
        },
        'Phone Number *': {
            hi: 'मोबाइल नंबर *',
        },
        'Phone Number': {
            hi: 'मोबाइल नंबर',
        },
        'Mobile Number': {
            hi: 'मोबाइल नंबर',
        },
        'Mobile Number *': {
            hi: 'मोबाइल नंबर *',
        },
        'Email Address': {
            hi: 'ईमेल पता',
        },
        'Email Address (Optional)': {
            hi: 'ईमेल पता (वैकल्पिक)',
        },
        'Department / Query': {
            hi: 'विभाग / प्रश्न का प्रकार',
        },
        'Department': {
            hi: 'चिकित्सा विभाग',
        },
        'Select Speciality': {
            hi: 'विशेषज्ञता चुनें',
        },
        'Select Doctor': {
            hi: 'डॉक्टर चुनें',
        },
        'Selected Doctor': {
            hi: 'चयनित डॉक्टर',
        },
        'Preferred Date': {
            hi: 'पसंदीदा परामर्श तिथि',
        },
        'Preferred Date *': {
            hi: 'पसंदीदा परामर्श तिथि *',
        },
        'Message / Query': {
            hi: 'आपका संदेश / चिकित्सा विवरण',
        },
        'Your Message': {
            hi: 'आपका संदेश',
        },
        'Patient Info': {
            hi: 'रोगी की जानकारी',
        },
        'Date & Details': {
            hi: 'तारीख एवं विवरण',
        },
        'Next: Choose Date': {
            hi: 'आगे: तारीख चुनें',
        },
        'Confirm Booking': {
            hi: 'बुकिंग कन्फर्म करें',
        },
        'Back': {
            hi: 'वापस जाएं',
        },
        // Speciality page booking form (views/partials/speciality-booking.ejs)
        'Book Your Appointment': {
            hi: 'अपना अपॉइंटमेंट बुक करें',
        },
        'Your details': {
            hi: 'आपकी जानकारी',
        },
        'Appointment details': {
            hi: 'अपॉइंटमेंट की जानकारी',
        },
        'Patient Name': {
            hi: 'रोगी का नाम',
        },
        'Mobile': {
            hi: 'मोबाइल',
        },
        'Email Id': {
            hi: 'ईमेल आईडी',
        },
        'Speciality': {
            hi: 'विशेषज्ञता',
        },
        'Doctor': {
            hi: 'डॉक्टर',
        },
        'Any Doctor': {
            hi: 'कोई भी डॉक्टर',
        },
        'Preferred date': {
            hi: 'पसंदीदा तारीख',
        },
        'Next →': {
            hi: 'आगे →',
        },
        '← Back': {
            hi: '← वापस जाएं',
        },
        'Submit Request': {
            hi: 'अनुरोध भेजें',
        },
        'Please wait..': {
            hi: 'कृपया प्रतीक्षा करें..',
        },
        'Submitting...': {
            hi: 'जमा हो रहा है...',
        },
        'Thank You!': {
            hi: 'धन्यवाद!',
        },
        'Enter your full name': {
            hi: 'अपना पूरा नाम दर्ज करें',
        },
        'Enter 10-digit mobile number': {
            hi: '10 अंकों का मोबाइल नंबर दर्ज करें',
        },
        '10-digit mobile number': {
            hi: '10 अंकों का मोबाइल नंबर',
        },
        'Enter patient full name': {
            hi: 'रोगी का पूरा नाम दर्ज करें',
        },
        'How can we help you? Describe your query or medical concern': {
            hi: 'हम आपकी कैसे मदद कर सकते हैं? अपना प्रश्न या चिकित्सा संबंधी चिंता लिखें',
        },
        'Send Message': {
            hi: 'संदेश भेजें',
        },

        // Footer & Utility
        'Centers of Clinical Excellence': {
            hi: 'उन्नत क्लिनिकल उत्कृष्टता केंद्र',
        },
        'Quick Links': {
            hi: 'त्वरित लिंक',
        },
        'Patients & Visitors': {
            hi: 'रोगी एवं आगंतुक',
        },
        'Emergency Contact': {
            hi: 'आपातकालीन हेल्पलाइन नंबर',
        },
        'OPD Enquiries': {
            hi: 'ओपीडी पूछताछ एवं परामर्श',
        },
        'All Rights Reserved': {
            hi: 'सर्वाधिकार सुरक्षित',
        },
        'Privacy Policy': {
            hi: 'गोपनीयता नीति',
        },
        'Disclaimer': {
            hi: 'चिकित्सा अस्वीकरण एवं कानूनी सूचना',
        },
        'View Profile': {
            hi: 'प्रोफाइल देखें',
        },
        'Book Consultation': {
            hi: 'परामर्श बुक करें',
        },
        'Experience & Qualifications': {
            hi: 'अनुभव एवं योग्यताएं',
        },
        'Special Interests & Expertise': {
            hi: 'विशेषज्ञता एवं रुचि के क्षेत्र',
        }
    };

    // 3. State & Persistence Management
    function getStoredLang() {
        // 1. Check URL param ?lang=XX
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && SUPPORTED_LANGUAGES[urlLang]) {
            setStoredLang(urlLang);
            return urlLang;
        }

        // 2. Check localStorage
        try {
            const local = localStorage.getItem('neotia_lang');
            if (local && SUPPORTED_LANGUAGES[local]) return local;
        } catch (e) {}

        // 3. Check cookies (neotia_lang or googtrans)
        const match = document.cookie.match(/(?:^|; )neotia_lang=([a-z]{2})/);
        if (match && SUPPORTED_LANGUAGES[match[1]]) return match[1];

        const gtMatch = document.cookie.match(/(?:^|; )googtrans=\/en\/([a-z]{2})/);
        if (gtMatch && SUPPORTED_LANGUAGES[gtMatch[1]]) return gtMatch[1];

        return 'en';
    }

    function setStoredLang(lang) {
        if (!SUPPORTED_LANGUAGES[lang]) return;
        try {
            localStorage.setItem('neotia_lang', lang);
        } catch (e) {}

        // Set neotia_lang cookie (1 year)
        const date = new Date();
        date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
        const expires = '; expires=' + date.toUTCString();
        document.cookie = 'neotia_lang=' + lang + expires + '; path=/; SameSite=Lax';

        // Set Google Translate cookie so automated bridge syncs seamlessly
        document.cookie = 'googtrans=/en/' + lang + expires + '; path=/; SameSite=Lax';
        const hostname = window.location.hostname;
        if (hostname && hostname !== 'localhost') {
            document.cookie = 'googtrans=/en/' + lang + expires + '; path=/; domain=.' + hostname + '; SameSite=Lax';
        }
    }

    // Visitors who chose a language we no longer offer (e.g. Bengali, Odia) are reset to English.
    // Runs before the Google Translate script loads, because the widget reads the googtrans cookie on its own.
    function resetUnsupportedLang() {
        let stale = false;
        try {
            const local = localStorage.getItem('neotia_lang');
            if (local && !SUPPORTED_LANGUAGES[local]) stale = true;
        } catch (e) {}
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang && !SUPPORTED_LANGUAGES[urlLang]) stale = true;
        const match = document.cookie.match(/(?:^|; )neotia_lang=([a-z]{2})/);
        if (match && !SUPPORTED_LANGUAGES[match[1]]) stale = true;
        const gtMatch = document.cookie.match(/(?:^|; )googtrans=\/en\/([a-z]{2})/);
        if (gtMatch && !SUPPORTED_LANGUAGES[gtMatch[1]]) stale = true;
        if (stale) setStoredLang('en');
    }

    // Noto Sans Devanagari is the Hindi fallback in --font-brand; only download it once Hindi is chosen
    function ensureHindiFont() {
        if (document.getElementById('font-hindi')) return;
        const link = document.createElement('link');
        link.id = 'font-hindi';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap';
        document.head.appendChild(link);
    }

    // 4. Proper Noun Protection
    // Adds class="notranslate" and translate="no" to doctors, contacts, addresses, logos
    function protectProperNouns() {
        const doctorSelectors = [
            '.doctor-card h4', '.doctor-card h3', '.doctor-name', '.doc-title',
            '[data-name]', '.doctor-card-col h4', '#pop_consultant',
            '.specialist-name', '.doctor-detail-header h1', '.author-name'
        ];
        doctorSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.classList.add('notranslate');
                el.setAttribute('translate', 'no');
            });
        });

        const brandSelectors = [
            '.navbar-brand', '.footer-logo', '.logo-part img', '.call-box-area a[href^="tel:"]',
            'a[href^="mailto:"]', '.emergency-number', '.notranslate-custom'
        ];
        brandSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.classList.add('notranslate');
                el.setAttribute('translate', 'no');
            });
        });
    }

    // 5. High-Precision DOM Dictionary Translator
    // Fast, flicker-free, 100% human-quality medical terms
    function applyDictionaryTranslations(targetLang) {
        if (!targetLang || targetLang === 'en') {
            // Restore English original text from data-i18n-orig if present
            document.querySelectorAll('[data-i18n-orig]').forEach(el => {
                el.textContent = el.getAttribute('data-i18n-orig');
            });
            document.querySelectorAll('[data-i18n-orig-placeholder]').forEach(el => {
                el.setAttribute('placeholder', el.getAttribute('data-i18n-orig-placeholder'));
            });
            return;
        }

        // Translate text nodes using dictionary keys
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    // Ignore scripts, styles, notranslate elements, code, inputs
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (parent.closest('.notranslate, script, style, code, pre, noscript')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.nodeValue.trim().length > 0) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        const nodesToTranslate = [];
        while (walker.nextNode()) {
            nodesToTranslate.push(walker.currentNode);
        }

        nodesToTranslate.forEach(node => {
            const raw = node.nodeValue.trim();
            if (DICTIONARY[raw] && DICTIONARY[raw][targetLang]) {
                const parent = node.parentElement;
                if (parent && !parent.hasAttribute('data-i18n-orig')) {
                    parent.setAttribute('data-i18n-orig', raw);
                }
                node.nodeValue = node.nodeValue.replace(raw, DICTIONARY[raw][targetLang]);
            }
        });

        // Translate Placeholders on inputs & textareas
        document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
            const orig = input.getAttribute('data-i18n-orig-placeholder') || input.getAttribute('placeholder');
            const clean = orig ? orig.trim() : '';
            if (DICTIONARY[clean] && DICTIONARY[clean][targetLang]) {
                if (!input.hasAttribute('data-i18n-orig-placeholder')) {
                    input.setAttribute('data-i18n-orig-placeholder', orig);
                }
                input.setAttribute('placeholder', DICTIONARY[clean][targetLang]);
            }
        });

        // Translate Button Values & aria-labels
        document.querySelectorAll('input[type="submit"], input[type="button"], button').forEach(btn => {
            const txt = btn.textContent.trim();
            if (DICTIONARY[txt] && DICTIONARY[txt][targetLang]) {
                if (!btn.hasAttribute('data-i18n-orig')) {
                    btn.setAttribute('data-i18n-orig', txt);
                }
                // Only replace text content if no icon or keep icons
                const icon = btn.querySelector('i, svg');
                if (icon) {
                    btn.childNodes.forEach(child => {
                        if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() === txt) {
                            child.nodeValue = ' ' + DICTIONARY[txt][targetLang] + ' ';
                        }
                    });
                } else {
                    btn.textContent = DICTIONARY[txt][targetLang];
                }
            }
        });
    }

    // 6. Automated Google Translate Bridge
    // Translates full articles, detailed medical descriptions, FAQs and CMS bodies
    let googleTranslateInitialized = false;

    window.googleTranslateElementInit = function () {
        if (googleTranslateInitialized) return;
        try {
            new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,hi',
                autoDisplay: false,
                multilanguagePage: true
            }, 'google_translate_element');
            googleTranslateInitialized = true;
        } catch (e) {
            console.warn('[i18n] Google Translate initialization error:', e);
        }
    };

    function loadGoogleTranslateScript() {
        if (window.google && window.google.translate) return;
        const existingScript = document.getElementById('google-translate-script');
        if (existingScript) return;

        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onerror = function () {
            console.info('[i18n] Running in standalone dictionary translation mode.');
        };
        document.head.appendChild(script);
    }

    function triggerGoogleTranslateChange(targetLang) {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = targetLang;
            select.dispatchEvent(new Event('change'));
        } else {
            // Poll for Google combo until ready (up to 4s)
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                const combo = document.querySelector('.goog-te-combo');
                if (combo) {
                    combo.value = targetLang;
                    combo.dispatchEvent(new Event('change'));
                    clearInterval(interval);
                } else if (attempts > 20) {
                    clearInterval(interval);
                }
            }, 200);
        }
    }

    // 7. Language Switch Orchestrator
    function switchLanguage(lang, reloadIfNeeded = false) {
        if (!SUPPORTED_LANGUAGES[lang]) return;

        // Set visual loading state on language buttons
        document.querySelectorAll('.lang-selector-btn').forEach(btn => {
            btn.classList.add('loading');
        });

        // Save preference
        setStoredLang(lang);
        if (lang === 'hi') ensureHindiFont();

        // Update html lang & font classes
        document.documentElement.setAttribute('lang', lang);
        document.body.classList.remove('lang-en', 'lang-hi');
        document.body.classList.add('lang-' + lang);

        // Update active UI badges and labels
        updateHeaderSelectorUI(lang);

        // Protect proper nouns
        protectProperNouns();

        // Apply fast curated dictionary
        applyDictionaryTranslations(lang);

        // Trigger Google Translate engine
        triggerGoogleTranslateChange(lang);

        // Remove loading state after brief transition
        setTimeout(() => {
            document.querySelectorAll('.lang-selector-btn').forEach(btn => {
                btn.classList.remove('loading');
            });
        }, 350);

        // Dispatch custom event for dynamic components to listen to
        window.dispatchEvent(new CustomEvent('neotiaLanguageChanged', { detail: { lang } }));
    }

    // 8. Update UI of the Selector Dropdowns in Header & Navbar
    function updateHeaderSelectorUI(lang) {
        const langConfig = SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES['en'];

        document.querySelectorAll('.neotia-lang-wrapper, .lang-selector-wrapper').forEach(wrapper => {
            const textEl = wrapper.querySelector('.neotia-lang-text');
            if (textEl) textEl.textContent = langConfig.badge;

            const labelEl = wrapper.querySelector('.lang-current-label, .lang-nav-label');
            const badgeEl = wrapper.querySelector('.lang-current-code, .nav-lang-badge');
            if (labelEl) labelEl.textContent = langConfig.native;
            if (badgeEl) badgeEl.textContent = langConfig.badge;

            // Highlight active option in dropdown
            wrapper.querySelectorAll('.lang-option').forEach(opt => {
                const optLang = opt.getAttribute('data-lang');
                if (optLang === lang) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            });
        });
    }

    // 9. Attach Event Listeners to Dropdown Selectors
    function initLanguageSelectorEvents() {
        // Toggle language dropdowns reliably on click
        document.addEventListener('click', function (e) {
            const toggle = e.target.closest('.neotia-lang-pill, .nav-lang-toggle, .lang-selector-btn, .lang-selector-wrapper [data-bs-toggle="dropdown"]');
            if (toggle) {
                e.preventDefault();
                e.stopPropagation();
                const wrapper = toggle.closest('.neotia-lang-wrapper, .dropdown, .lang-selector-wrapper');
                const menu = wrapper ? wrapper.querySelector('.neotia-lang-menu, .lang-dropdown-menu, .dropdown-menu') : null;
                
                // Close other open language menus first
                document.querySelectorAll('.neotia-lang-menu.show, .lang-dropdown-menu.show').forEach(m => {
                    if (m !== menu) {
                        m.classList.remove('show');
                        const b = m.parentElement ? m.parentElement.querySelector('.neotia-lang-pill, .dropdown-toggle') : null;
                        if (b) b.classList.remove('show');
                    }
                });
                
                if (menu) {
                    const isOpen = menu.classList.contains('show');
                    menu.classList.toggle('show', !isOpen);
                    toggle.classList.toggle('show', !isOpen);
                }
                return;
            }

            // Close language dropdowns on click outside
            if (!e.target.closest('.neotia-lang-wrapper, .lang-selector-wrapper')) {
                document.querySelectorAll('.neotia-lang-menu.show, .lang-dropdown-menu.show').forEach(m => {
                    m.classList.remove('show');
                    const btn = m.parentElement ? m.parentElement.querySelector('.neotia-lang-pill, .dropdown-toggle') : null;
                    if (btn) btn.classList.remove('show');
                });
            }
        });

        // Handle language option selection
        document.addEventListener('click', function (e) {
            const option = e.target.closest('.lang-option');
            if (!option) return;

            e.preventDefault();
            const targetLang = option.getAttribute('data-lang');
            if (targetLang && SUPPORTED_LANGUAGES[targetLang]) {
                switchLanguage(targetLang);

                // Close dropdown
                document.querySelectorAll('.neotia-lang-menu.show, .lang-dropdown-menu.show').forEach(m => {
                    m.classList.remove('show');
                    const btn = m.parentElement ? m.parentElement.querySelector('.neotia-lang-pill, .dropdown-toggle') : null;
                    if (btn) btn.classList.remove('show');
                });
            }
        });
    }

    // 10. MutationObserver for Dynamically Injected Modals & Ajax
    function initDynamicObserver() {
        const observer = new MutationObserver(function (mutations) {
            let hasNewContent = false;
            for (let mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    hasNewContent = true;
                    break;
                }
            }
            if (hasNewContent) {
                const currentLang = getStoredLang();
                if (currentLang !== 'en') {
                    protectProperNouns();
                    applyDictionaryTranslations(currentLang);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 11. Initialization on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        resetUnsupportedLang();
        protectProperNouns();
        initLanguageSelectorEvents();
        loadGoogleTranslateScript();

        const activeLang = getStoredLang();
        if (activeLang === 'hi') ensureHindiFont();
        document.documentElement.setAttribute('lang', activeLang);
        document.body.classList.add('lang-' + activeLang);
        updateHeaderSelectorUI(activeLang);

        if (activeLang !== 'en') {
            applyDictionaryTranslations(activeLang);
            setTimeout(() => {
                triggerGoogleTranslateChange(activeLang);
            }, 400);
        }

        initDynamicObserver();
    });

    // Expose global controller
    window.NeotiaI18n = {
        switchLanguage: switchLanguage,
        getCurrentLang: getStoredLang,
        languages: SUPPORTED_LANGUAGES,
        dictionary: DICTIONARY
    };

})();
