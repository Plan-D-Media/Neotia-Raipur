/**
 * Site-wide action bar (views/partials/action-bar.ejs).
 * - Keeps --header-height / --action-bar-height / --mobile-bar-height / --page-offset in sync,
 *   so the fixed header and bars never cover page content, anchors or focused fields.
 * - Homepage: the bar (and the mobile bottom bar) only appear once the hero's own search
 *   and buttons have scrolled out of view, so the two never show at the same time.
 * - Mobile: the header search icon opens the bar as a full-width search panel.
 * - "Request a Callback" opens the shared callback modal, adding it to pages that lack one.
 */
(function () {
    'use strict';

    const root = document.documentElement;
    const header = document.getElementById('mainHeader');
    const bar = document.getElementById('actionBar');
    const mobileBar = document.querySelector('.mobile-action-bar');
    if (!header || !bar) return;

    const isHome = bar.classList.contains('action-bar--after-hero');
    const mqMobile = window.matchMedia('(max-width: 768px)');
    const searchToggle = header.querySelector('.header-search-toggle');
    const searchInput = bar.querySelector('[data-search-input]');
    let heroInView = isHome;

    const px = (name, value) => root.style.setProperty(name, Math.round(value) + 'px');

    // First visible piece of page content: text, image or video outside the header and bars
    function firstContentTop() {
        const skip = el => el.closest('#mainHeader, #actionBar, .mobile-action-bar, .modal, template, script, style, .whatsapp-float, .go-top, .callback-btn');
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        let el;
        while ((el = walker.nextNode())) {
            if (skip(el)) continue;
            const isMedia = /^(IMG|VIDEO|IFRAME)$/.test(el.tagName);
            const hasText = !isMedia && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
            if (!isMedia && !hasText) continue;
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || s.position === 'fixed') continue;
            return { top: r.top + window.scrollY, isMedia };
        }
        return null;
    }

    function layout() {
        const headerHeight = header.offsetHeight;
        px('--header-height', headerHeight);

        const barShown = !mqMobile.matches && (!isHome || !heroInView);
        const barHeight = barShown ? bar.offsetHeight : 0;
        px('--action-bar-height', barHeight);
        px('--mobile-bar-height', mqMobile.matches && mobileBar ? mobileBar.offsetHeight : 0);

        // Push the page down only as far as needed to clear the fixed header (+ bar on inner pages)
        const reserved = headerHeight + (isHome ? 0 : barHeight);
        px('--page-offset', 0);
        // Text gets 12px breathing room below the bars; full-bleed media can sit flush
        const first = firstContentTop();
        px('--page-offset', first ? Math.max(0, reserved + (first.isMedia ? 0 : 12) - first.top) : reserved);

        root.style.scrollPaddingTop = `calc(${headerHeight + barHeight}px + 12px)`;
        root.style.scrollPaddingBottom = mqMobile.matches && mobileBar ? `calc(${mobileBar.offsetHeight}px + 12px)` : '';
    }

    function setHeroInView(inView) {
        heroInView = inView;
        bar.classList.toggle('is-visible', !inView);
        if (mobileBar) mobileBar.classList.toggle('is-hidden', isHome && inView);
        layout();
    }

    // Homepage: watch the hero search + hero buttons
    if (isHome && 'IntersectionObserver' in window) {
        const targets = [document.getElementById('searchform'), document.querySelector('.home_button')].filter(Boolean);
        const visible = new Set();
        if (targets.length) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
                setHeroInView(visible.size > 0);
            }, { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` });
            targets.forEach(t => io.observe(t));
        } else {
            setHeroInView(false);
        }
    } else {
        heroInView = false;
        bar.classList.add('is-visible');
    }

    // Mobile search panel
    function setSearchOpen(open) {
        bar.classList.toggle('is-search-open', open);
        if (searchToggle) searchToggle.setAttribute('aria-expanded', String(open));
        if (open && searchInput) searchInput.focus();
    }

    if (searchToggle) {
        searchToggle.addEventListener('click', () => setSearchOpen(!bar.classList.contains('is-search-open')));
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && bar.classList.contains('is-search-open')) {
            setSearchOpen(false);
            if (searchToggle) searchToggle.focus();
        }
    });
    document.addEventListener('click', e => {
        if (mqMobile.matches && bar.classList.contains('is-search-open') && !bar.contains(e.target) && !(searchToggle && searchToggle.contains(e.target))) {
            setSearchOpen(false);
        }
    });

    // Callback modal: reuse the page's own, or add the shared one from the footer template
    function callbackModal() {
        let modal = document.getElementById('requestcallback');
        if (!modal) {
            const tpl = document.getElementById('callbackModalTemplate');
            if (!tpl) return null;
            document.body.appendChild(tpl.content.cloneNode(true));
            modal = document.getElementById('requestcallback');
            if (modal && window.NeotiaI18n && window.NeotiaI18n.getCurrentLang() !== 'en') {
                window.NeotiaI18n.switchLanguage(window.NeotiaI18n.getCurrentLang());
            }
        }
        return modal;
    }

    document.addEventListener('click', e => {
        const trigger = e.target.closest('[data-callback-trigger]');
        if (!trigger) return;
        e.preventDefault();
        const modal = callbackModal();
        if (modal && window.bootstrap) {
            window.bootstrap.Modal.getOrCreateInstance(modal).show();
        } else {
            window.location.href = '/contact';
        }
    });

    // The hamburger is a div: make it work from the keyboard too
    const menuBar = header.querySelector('.menu-bar');
    if (menuBar) {
        menuBar.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                menuBar.click();
            }
        });
    }

    // Re-measure whenever sizes change (breakpoints, web font swap, Hindi text)
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => layout());
        [header, bar, mobileBar].filter(Boolean).forEach(el => ro.observe(el));
    }
    window.addEventListener('resize', layout);
    mqMobile.addEventListener('change', () => { setSearchOpen(false); layout(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    window.addEventListener('load', layout);
    layout();
})();
