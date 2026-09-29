
  /**
   * File: messagepoint-main.js
   *
   * Sections:
   * 1) Console Start Message
   * 2) Utilities (minimal)
   * 3) Modules
   * 4) Init
   * 5) Console End Message
   */

  (() => {
    'use strict';

    //=============================================================================
    // 1) CONSOLE START MESSAGE
    //-----------------------------------------------------------------------------
    const START_BADGE = 'color:#fff;background:#111;padding:4px 8px;border-radius:6px;font-weight:700;';
    const START_BADGE_2 = 'color:#111;background:#badeca;padding:4px 8px;border-radius:6px;font-weight:700;';
    try {
      // eslint-disable-next-line no-console
      console.log('%cSite Modules%c boot', START_BADGE, START_BADGE_2);
    } catch (_) {}

    //=============================================================================
    // 2) UTILITIES (minimal)
    //-----------------------------------------------------------------------------
    const Utils = (() => {
      const qs = (sel, root = document) => root.querySelector(sel);
      const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

      const isFn = (v) => typeof v === 'function';

      const safeConsole = {
        log: (...args) => {
          try {
            // eslint-disable-next-line no-console
            console.log(...args);
          } catch (_) {}
        },
        warn: (...args) => {
          try {
            // eslint-disable-next-line no-console
            console.warn(...args);
          } catch (_) {}
        },
        error: (...args) => {
          try {
            // eslint-disable-next-line no-console
            console.error(...args);
          } catch (_) {}
        },
      };

      // Safe module runner: one module error won't stop the rest
      const run = (name, fn) => {
        try {
          fn();
          safeConsole.log(`✅ ${name}`);
        } catch (err) {
          safeConsole.error(`❌ ${name} failed`, err);
        }
      };

      // Optional: wait for DOM ready
      const onReady = (fn) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
          fn();
        }
      };

      return Object.freeze({ qs, qsa, isFn, run, onReady, safeConsole });
    })();

    //=============================================================================
    // 3) MODULES
    //-----------------------------------------------------------------------------

    //-----------------------------------------------------------------------------
    // GO TO TOP (Lenis-first, native fallback)
    // Finds: [data-function="go-to-top"]
    //-----------------------------------------------------------------------------
    const GoToTop = (() => {
      const DEFAULTS = Object.freeze({
        selector: '[data-function="go-to-top"]',
        // Change this if your Lenis instance lives elsewhere
        getLenis: () => window.lenis || null,
        // Lenis scroll options (modern Lenis expects (target, options))
        lenisOptions: {
          duration: 1.1, // seconds
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          immediate: false,
          force: true,
          lock: false,
        },
      });

      const scrollToTop = (cfg) => {
        const lenis = cfg.getLenis?.();
        if (lenis && Utils.isFn(lenis.scrollTo)) {
          lenis.scrollTo(0, cfg.lenisOptions);
          return;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      };

      const bind = (el, cfg) => {
        el.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            scrollToTop(cfg);
          },
          { passive: false },
        );
      };

      const init = (options = {}) => {
        const cfg = Object.assign({}, DEFAULTS, options);
        const els = Utils.qsa(cfg.selector);
        if (!els.length) return;
        els.forEach((el) => bind(el, cfg));
      };

      return Object.freeze({ init });
    })();

    // -----------------------------------------------------------------------------
    // SMART SWIPER
    // - Auto loads Swiper CSS/JS (v11) once, shared across all instances
    // - Attribute-driven init via [data-swiper] — zero JS required for standard use
    // - Lazy init via IntersectionObserver
    // - Repairs on tab clicks + resize
    // - Supports centeredSlides via data-swiper-centered
    // - Scopes nav + pagination within each .swiper-component wrapper
    // - SmartSwiper.ready(fn)              — run code once Swiper assets are loaded
    // - SmartSwiper.initEl(el|sel, opts)   — manually init any element with custom opts
    //                                        accepts a CSS selector string OR a DOM element
    // -----------------------------------------------------------------------------
    const SmartSwiper = (() => {
      const SELECTOR = '.swiper[data-swiper]';
      const CSS_URL = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
      const JS_URL = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';

      const hasIO = 'IntersectionObserver' in window;
      const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const DEFAULTS = Object.freeze({
        slidesPerView: 3,
        spaceBetween: 20,
        speed: 735,
        loop: false,
        autoplay: false,
        centeredSlides: false,
        watchOverflow: true,
        simulateTouch: true,
        threshold: 0,
        touchReleaseOnEdges: true,
        observer: true,
        observeParents: true,
        observeSlideChildren: true,
        navigation: false,
        breakpoints: {
          0: { slidesPerView: 1, spaceBetween: 14 },
          768: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
        },
      });

      // ── Asset loading ──────────────────────────────────────────────────────────
      // Assets load unconditionally on init() — not gated on [data-swiper] elements
      // existing. This guarantees ready() and initEl() always resolve.
      let assetsReady = false;
      const readyQueue = [];

      function onAssetsReady() {
        assetsReady = true;
        readyQueue.splice(0).forEach((fn) => fn());
      }

      // Public: SmartSwiper.ready(fn)
      // Fires fn immediately if assets already loaded, otherwise queues it.
      function ready(fn) {
        if (typeof fn !== 'function') return;
        if (assetsReady) fn();
        else readyQueue.push(fn);
      }

      // ── Helpers ────────────────────────────────────────────────────────────────
      const idle = (fn) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn) : setTimeout(fn, 0));

      const parseBool = (value, fallback = false) => {
        if (value == null || value === '') return fallback;
        return String(value).toLowerCase() === 'true';
      };

      const parseNum = (value, fallback) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
      };

      const parseTriple = (value, fallback) => {
        if (!value) return fallback.slice();
        const parts = String(value)
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);
        const desktop = parseNum(parts[0], fallback[0]);
        const tablet = parseNum(parts[1], parts[0] != null ? desktop : fallback[1]);
        const mobile = parseNum(parts[2], parts[1] != null ? tablet : fallback[2]);
        return [desktop, tablet, mobile];
      };

      const isDisplayed = (el) => !!el?.getClientRects?.().length;
      const getInstance = (el) => (el ? el._smartSwiperInstance || el.swiper || null : null);

      // ── Asset injection ────────────────────────────────────────────────────────
      function ensureCSS() {
        if (document.querySelector(`link[href*="${CSS_URL}"]`)) return;
        const link = document.createElement('link');
        link.setAttribute('data-cmp-ab', '2');
        link.rel = 'stylesheet';
        link.href = CSS_URL;
        document.head.appendChild(link);
      }

      function ensureJS(cb) {
        if (window.Swiper) {
          cb();
          return;
        }

        const existing = document.querySelector(`script[src*="${JS_URL}"]`);
        if (existing) {
          const wait = () => (window.Swiper ? cb() : setTimeout(wait, 40));
          wait();
          return;
        }

        const s = document.createElement('script');
        s.setAttribute('data-cmp-ab', '2'); // must be set before src + append
        s.src = JS_URL;
        s.defer = true;
        s.onload = cb;
        s.onerror = (e) => console.error('[SmartSwiper] Swiper bundle failed to load', JS_URL, e);
        document.body.appendChild(s);
      }

      // ── Scope + nav resolution ─────────────────────────────────────────────────
      function resolveScope(el) {
        const selector = (el.dataset.swiperScope || '').trim();
        if (!selector) {
          return el.closest('.swiper-component') || el.parentElement || document;
        }
        let root = null;
        try {
          root = el.closest(selector);
        } catch (_) {}
        if (root) return root;
        try {
          root = document.querySelector(selector);
        } catch (_) {}
        return root || el.closest('.swiper-component') || el.parentElement || document;
      }

      function resolveNav(el) {
        const scope = resolveScope(el);
        return {
          scope,
          prev: scope?.querySelector('.swiper-prev') ?? null,
          next: scope?.querySelector('.swiper-next') ?? null,
        };
      }

      // ── Autoplay builder ───────────────────────────────────────────────────────
      function buildAutoplay(el) {
        const enabled = parseBool(el.dataset.swiperAutoplay, DEFAULTS.autoplay);
        if (!enabled) return false;
        const raw = el.dataset.swiperAutoplayDelay;
        const delay = raw == null || raw === '' || raw === 'false' ? 5000 : Math.max(0, parseNum(raw, 5000));
        if (!delay) return false;
        return { delay, disableOnInteraction: true };
      }

      // ── Attribute option reader ────────────────────────────────────────────────
      function readOptions(el) {
        const slides = parseTriple(el.dataset.swiperSlides, [3, 2, 1]);
        const spaces = parseTriple(el.dataset.swiperSpace, [20, 16, 14]);
        const centered = parseBool(el.dataset.swiperCentered, false);
        const scope = resolveScope(el);

        const opts = {
          ...DEFAULTS,
          speed: parseNum(el.dataset.swiperSpeed, DEFAULTS.speed),
          loop: parseBool(el.dataset.swiperLoop, DEFAULTS.loop),
          autoplay: buildAutoplay(el),
          centeredSlides: centered,
          breakpoints: {
            0: {
              ...DEFAULTS.breakpoints[0],
              slidesPerView: slides[2],
              spaceBetween: spaces[2],
              centeredSlides: centered,
            },
            768: {
              ...DEFAULTS.breakpoints[768],
              slidesPerView: slides[1],
              spaceBetween: spaces[1],
              centeredSlides: centered,
            },
            1024: {
              ...DEFAULTS.breakpoints[1024],
              slidesPerView: slides[0],
              spaceBetween: spaces[0],
              centeredSlides: centered,
            },
          },
        };

        const paginationEl = scope?.querySelector('.swiper-pagination');
        if (paginationEl) {
          opts.pagination = { el: paginationEl, clickable: true };
        }

        if (reduceMotion) {
          opts.autoplay = false;
          opts.speed = Math.min(opts.speed || 400, 300);
        }

        const { prev, next } = resolveNav(el);
        if (prev || next) {
          opts.navigation = {
            prevEl: prev ?? null,
            nextEl: next ?? null,
            addIcons: false,
          };
        }

        return opts;
      }

      // ── Edge nav dimming ───────────────────────────────────────────────────────
      function bindEdgeNavState(el, swiper) {
        if (!swiper || el.dataset.swiperEdgeNavBound === '1') return;
        el.dataset.swiperEdgeNavBound = '1';

        const { prev, next } = resolveNav(el);
        const setHidden = (btn, hidden) => {
          if (!btn) return;
          btn.style.opacity = hidden ? '0.32' : '1';
          btn.style.cursor = hidden ? 'not-allowed' : 'pointer';
        };

        const update = () => {
          const locked = !!swiper.isLocked;
          setHidden(prev, locked || !!swiper.isBeginning);
          setHidden(next, locked || !!swiper.isEnd);
        };

        update();
        ['slideChange', 'reachBeginning', 'reachEnd', 'fromEdge', 'resize', 'update', 'lock', 'unlock'].forEach((evt) => {
          try {
            swiper.on(evt, update);
          } catch (_) {}
        });
      }

      // ── Core init / update (attribute-driven) ─────────────────────────────────
      function initOne(el) {
        if (!el) return;
        const existing = getInstance(el);
        if (existing) {
          updateOne(el);
          return;
        }
        if (!isDisplayed(el)) return;
        try {
          const swiper = new Swiper(el, readOptions(el));
          el._smartSwiperInstance = swiper;
          bindEdgeNavState(el, swiper);
          try {
            swiper.update();
          } catch (_) {}
        } catch (_) {}
      }

      function updateOne(el) {
        const swiper = getInstance(el);
        if (!swiper) {
          initOne(el);
          return;
        }
        if (!isDisplayed(el)) return;
        try {
          swiper.update();
          swiper.navigation?.update?.();
          bindEdgeNavState(el, swiper);
        } catch (_) {}
      }

      // ── Public: initEl ─────────────────────────────────────────────────────────
      //
      // Accepts a CSS selector STRING or a DOM element.
      //
      // KEY DIFFERENCE from attribute-driven init:
      // - The element is resolved INSIDE ready(), not at call time.
      // - This means you can safely call initEl() before the DOM is ready,
      //   before the element exists, or before Swiper assets are loaded.
      //   It will always work as long as the element exists by the time
      //   ready() fires (i.e. after DOMContentLoaded + Swiper JS loaded).
      // - No isDisplayed() guard — callers should know their element is visible.
      //
      // Usage:
      //   SmartSwiper.initEl('.my-slider', { loop: true, slidesPerView: 1 });
      //   SmartSwiper.initEl(document.querySelector('.my-slider'), { loop: true });
      //
      function initEl(elOrSelector, customOptions = {}) {
        ready(() => {
          // Resolve selector string here — after DOM + assets are ready
          const el = typeof elOrSelector === 'string' ? document.querySelector(elOrSelector) : elOrSelector;

          if (!el) {
            console.warn(`SmartSwiper.initEl: element not found for "${elOrSelector}"`);
            return;
          }

          if (getInstance(el)) return; // already initialized

          try {
            const swiper = new Swiper(el, { ...DEFAULTS, ...customOptions });
            el._smartSwiperInstance = swiper;
            try {
              swiper.update();
            } catch (_) {}
          } catch (err) {
            console.error('SmartSwiper.initEl: Swiper init failed', err);
          }
        });
      }

      // ── Scan + observe ─────────────────────────────────────────────────────────
      function scan() {
        return Array.from(document.querySelectorAll(SELECTOR));
      }

      function observeAndInit(els) {
        if (!els.length) return;
        if (!hasIO) {
          els.forEach(initOne);
          return;
        }

        const io = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              initOne(entry.target);
              observer.unobserve(entry.target);
            });
          },
          { rootMargin: '200px 0px' },
        );

        els.forEach((el) => {
          if (!getInstance(el)) io.observe(el);
        });
      }

      // ── Boot ───────────────────────────────────────────────────────────────────
      function boot() {
        ensureCSS();
        ensureJS(() => {
          onAssetsReady(); // always resolve ready() queue first
          const els = scan();
          if (els.length) observeAndInit(els); // then init attribute swipers if any
        });
      }

      let refreshTimer;
      function refresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          scan().forEach(updateOne);
        }, 100);
      }

      // ── Init ───────────────────────────────────────────────────────────────────
      function init() {
        const start = () => {
          idle(boot);

          document.addEventListener(
            'click',
            (e) => {
              if (e.target?.closest?.('.w-tab-link')) {
                setTimeout(refresh, 60);
                setTimeout(refresh, 180);
                setTimeout(refresh, 320);
              }
            },
            true,
          );

          window.addEventListener('resize', refresh, { passive: true });

          window.smartSwiper = Object.freeze({
            init,
            refresh,
            update: refresh,
            ready,
            initEl,
          });
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
          start();
        }
      }

      return Object.freeze({ init, refresh, ready, initEl });
    })();

    // =============================================================================
    // HOW TO ADD A CUSTOM SWIPER
    // =============================================================================
    //
    // Always pass a SELECTOR STRING — not document.querySelector() — so the
    // element is resolved after the DOM and Swiper assets are ready.
    //
    // ── Option A: SmartSwiper.initEl() ──────────────────────────────────────────
    // Simplest. No instance returned.
    //
    //   SmartSwiper.initEl('.resources-hero-slider-w .swiper', {
    //     slidesPerView:  1.15,
    //     centeredSlides: true,
    //     spaceBetween:   28,
    //     loop:           true,
    //     speed:          600,
    //     grabCursor:     true,
    //     breakpoints: {
    //       0:    { slidesPerView: 1,    spaceBetween: 16, centeredSlides: false },
    //       768:  { slidesPerView: 1.08, spaceBetween: 20, centeredSlides: true  },
    //       1024: { slidesPerView: 1.15, spaceBetween: 28, centeredSlides: true  },
    //     },
    //     navigation: {
    //       prevEl: '.resources-hero-slider-w .swiper-prev',
    //       nextEl: '.resources-hero-slider-w .swiper-next',
    //     },
    //     pagination: {
    //       el: '.resources-hero-slider-w .swiper-pagination',
    //       clickable: true,
    //     },
    //   });
    //
    //
    // ── Option B: SmartSwiper.ready() + new Swiper() ────────────────────────────
    // Use when you need the instance back (e.g. to call .slideTo() or .destroy()).
    //
    //   let resourcesSlider;
    //
    //   SmartSwiper.ready(() => {
    //     resourcesSlider = new Swiper('.resources-hero-slider-w .swiper', {
    //       slidesPerView:  1.15,
    //       centeredSlides: true,
    //       loop:           true,
    //     });
    //   });
    //
    //   // Later — e.g. jump to slide on filter click:
    //   document.querySelector('.filter-btn').addEventListener('click', () => {
    //     resourcesSlider.slideTo(0);
    //   });
    //
    //
    // ── Rules ────────────────────────────────────────────────────────────────────
    // 1. Pass a selector STRING to initEl(), not document.querySelector().
    //    The element is resolved inside ready() — after DOM + assets are loaded.
    // 2. For ready() + new Swiper(), the element must exist by DOMContentLoaded.
    // 3. Do NOT add [data-swiper] to custom elements — SmartSwiper will re-init
    //    them with attribute options and override yours.
    // 4. initEl() logs a warning if the element isn't found — check the console.
    // =============================================================================

    //-----------------------------------------------------------------------------
    // CLICK ON LOAD (module)
    //-----------------------------------------------------------------------------
    const ClickOnLoad = (() => {
      const DEFAULTS = Object.freeze({
        selector: '[data-click-on-load]',
        clickedAttr: 'data-clicked-on-load',
        retryDelays: [0, 50, 200, 800, 2000],
        observeMutations: true,
        mutationDebounce: 120,
        alsoRunOnWindowLoad: true,
        skipAnchorsWithHref: false,
        domReadyDelay: 320,
      });

      const safeDispatchClick = (el) => {
        try {
          el.dispatchEvent(
            new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          );
        } catch (_) {}
        try {
          if (typeof el.click === 'function') el.click();
        } catch (_) {}
      };

      const shouldSkip = (el, cfg) => {
        if (!el || el.nodeType !== 1) return true;
        if (el.hasAttribute(cfg.clickedAttr)) return true;
        if (cfg.skipAnchorsWithHref && el.matches('a[href]')) return true;
        return false;
      };

      const clickOne = (el, cfg) => {
        if (shouldSkip(el, cfg)) return false;
        el.setAttribute(cfg.clickedAttr, '1');
        safeDispatchClick(el);
        return true;
      };

      const clickAll = (cfg, root = document) => {
        const nodes = root.querySelectorAll(`${cfg.selector}:not([${cfg.clickedAttr}])`);
        nodes.forEach((el) => clickOne(el, cfg));
        return nodes.length;
      };

      const scheduleRetries = (cfg) => {
        cfg.retryDelays.forEach((ms) => setTimeout(() => clickAll(cfg), ms));
      };

      const debounce = (fn, wait) => {
        let t;
        return () => {
          clearTimeout(t);
          t = setTimeout(fn, wait);
        };
      };

      const onWebflowReady = (fn) => {
        if (window.Webflow && Array.isArray(window.Webflow)) window.Webflow.push(fn);
        else fn();
      };

      const init = (options = {}) => {
        const cfg = Object.assign({}, DEFAULTS, options);

        const start = () => {
          scheduleRetries(cfg);

          if (cfg.observeMutations && 'MutationObserver' in window) {
            const recheck = debounce(() => scheduleRetries(cfg), cfg.mutationDebounce);
            const mo = new MutationObserver(recheck);
            mo.observe(document.documentElement, {
              childList: true,
              subtree: true,
            });
            window.__clickOnLoadMO = mo;
          }

          if (cfg.alsoRunOnWindowLoad) {
            window.addEventListener('load', () => scheduleRetries(cfg), {
              once: true,
            });
          }
        };

        const boot = () => {
          setTimeout(() => onWebflowReady(start), cfg.domReadyDelay);
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', boot, { once: true });
        } else {
          boot();
        }
      };

      return Object.freeze({ init });
    })();

    //-----------------------------------------------------------------------------
    // NAV SHRINK ON SCROLL (toggles .is-shrunk on multiple nav wrappers at 5vh)
    // + swaps the brand logo (.g-nav-brand-logo) while the nav is shrunk.
    //
    //   Shrunk logo URL resolution (first match wins):
    //     1. [data-logo-shrunk="..."] custom attribute on the <img> itself
    //        (set it in the Designer if a page/locale needs a different one)
    //     2. SHRUNK_LOGO constant below (site-wide fallback)
    //
    //   The original src (and srcset, if Webflow added one) is remembered and
    //   restored when the nav un-shrinks. The shrunk logo is preloaded so the
    //   first swap doesn't flash an empty logo.
    //-----------------------------------------------------------------------------
    const NavShrink = (() => {
      const SHRUNK_LOGO = 'https://cdn.prod.website-files.com/6a6b877f2665785581430d2b/6a763cd887585a9ecc537e5d_SEFAS_MP_FRE_Logo%402x%201.png';
      const LOGO_SELECTOR = '.g-nav-brand-logo';

      // Remember each logo's default src/srcset so it can be restored later
      const prepareLogos = () => {
        const logos = Array.from(document.querySelectorAll(LOGO_SELECTOR));
        logos.forEach((img) => {
          if (!img.dataset.logoDefault) img.dataset.logoDefault = img.getAttribute('src') || '';
          if (!img.dataset.logoShrunk) img.dataset.logoShrunk = SHRUNK_LOGO;
          if (img.hasAttribute('srcset') && !img.dataset.logoDefaultSrcset) {
            img.dataset.logoDefaultSrcset = img.getAttribute('srcset');
          }
        });
        return logos;
      };

      // Warm the cache so the first swap is instant
      const preload = (logos) => {
        const urls = new Set();
        logos.forEach((img) => {
          const url = img.dataset.logoShrunk;
          if (url && url !== img.dataset.logoDefault) urls.add(url);
        });
        urls.forEach((url) => {
          const i = new Image();
          i.src = url;
        });
      };

      const setLogo = (logos, shrunk) => {
        logos.forEach((img) => {
          const next = shrunk ? img.dataset.logoShrunk : img.dataset.logoDefault;
          if (!next || img.getAttribute('src') === next) return;
          if (shrunk) {
            // srcset takes priority over src, so drop it while the shrunk logo shows
            img.removeAttribute('srcset');
          } else if (img.dataset.logoDefaultSrcset) {
            img.setAttribute('srcset', img.dataset.logoDefaultSrcset);
          }
          img.setAttribute('src', next);
        });
      };

      function init() {
        const targets = document.querySelectorAll('.g-navigation-w, .s-topbar, .s-g-navigation, .sw-g-nav');
        if (!targets.length) return;
        const logos = prepareLogos();
        preload(logos);
        const getThresholdPx = () => window.innerHeight * 0.05; // 5vh
        let thresholdPx = getThresholdPx();
        let isShrunk = null; // only touch the logo when the state actually flips
        const update = () => {
          const shouldShrink = window.scrollY >= thresholdPx;
          targets.forEach((el) => el.classList.toggle('is-shrunk', shouldShrink));
          if (shouldShrink !== isShrunk) {
            isShrunk = shouldShrink;
            setLogo(logos, shouldShrink);
          }
        };
        const onResize = () => {
          thresholdPx = getThresholdPx();
          update();
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
      }
      return { init };
    })();

    //-----------------------------------------------------------------------------
    // STYLED TEXT  (robust)
    // _word_   -> <em>word</em>
    // **word** -> <strong>word</strong>
    // Processes text nodes inside [data-styled-text] roots. Survives Finsweet
    // filtering/sorting, late injection, tab/accordion reveals, and hidden nodes.
    // Mark a CONTAINER (e.g. a Collection List wrapper) to cover every current,
    // filtered, and future item inside it.
    //-----------------------------------------------------------------------------
    const StyledText = (() => {
      const CONFIG = {
        selector: '[data-styled-text]', // marked roots; can be a leaf or a container
        global: false, // true = scan entire <body> (see caveat below)
        debounce: 120,
      };

      // Pattern sources (strings, so we can build fresh RegExps per call — no shared lastIndex)
      const BOLD = { src: '\\*\\*([^*\\n]+)\\*\\*', marker: '*', tag: 'strong' };
      const ITAL = { src: '_([^_\\n]+)_', marker: '_', tag: 'em' };

      let mo = null;
      let timer = null;

      const isSkip = (el) => {
        if (!el || el.nodeType !== 1) return false;
        const t = el.tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'CODE' || t === 'PRE' || t === 'TEXTAREA' || t === 'KBD' || t === 'SAMP') return true;
        if (el.isContentEditable) return true;
        if (el.matches && el.matches('input,select,option,[data-styled-text-skip]')) return true;
        return false;
      };

      // Replace one text node's matches with <tag> elements (created via DOM → no XSS).
      const replaceInNode = (textNode, src, tag) => {
        const text = textNode.nodeValue;
        const re = new RegExp(src, 'g');
        let last = 0,
          m,
          frag = null;
        while ((m = re.exec(text)) !== null) {
          if (!frag) frag = document.createDocumentFragment();
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const el = document.createElement(tag);
          el.textContent = m[1];
          frag.appendChild(el);
          last = m.index + m[0].length;
        }
        if (frag) {
          if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
          textNode.parentNode.replaceChild(frag, textNode);
        }
      };

      const wrapPattern = (root, pat) => {
        const test = new RegExp(pat.src);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const v = node.nodeValue;
            if (!v || v.indexOf(pat.marker) === -1) return NodeFilter.FILTER_SKIP;
            let a = node.parentNode;
            while (a && a !== root) {
              if (isSkip(a)) return NodeFilter.FILTER_REJECT;
              a = a.parentNode;
            }
            return test.test(v) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
          },
        });
        const targets = [];
        let n;
        while ((n = walker.nextNode())) targets.push(n);
        targets.forEach((tn) => replaceInNode(tn, pat.src, pat.tag));
      };

      // Bold first, then italic — running italic after bold yields nested
      // <strong><em>x</em></strong> for **_x_** automatically.
      const processRoot = (root) => {
        wrapPattern(root, BOLD);
        wrapPattern(root, ITAL);
      };

      const getRoots = () => {
        const all = Array.from(document.querySelectorAll(CONFIG.selector));
        // drop roots nested inside another marked root (avoid double work)
        return all.filter((el) => !el.parentElement || !el.parentElement.closest(CONFIG.selector));
      };

      const processAll = () => {
        const roots = CONFIG.global ? [document.body] : getRoots();
        if (!roots.length) return;
        if (mo) mo.disconnect(); // don't react to our own mutations
        try {
          roots.forEach(processRoot);
        } catch (_) {
        } finally {
          if (mo) {
            mo.takeRecords(); // discard the mutations we just caused
            observe();
          }
        }
      };

      const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(processAll, CONFIG.debounce);
      };

      const observe = () => {
        mo.observe(document.documentElement, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      };

      const init = (options = {}) => {
        Object.assign(CONFIG, options);

        processAll();

        if ('MutationObserver' in window) {
          mo = new MutationObserver(schedule); // catches injection + Finsweet re-renders
          observe();
        }

        // Belt-and-suspenders triggers
        window.addEventListener('load', schedule, { once: true });
        document.addEventListener('click', () => setTimeout(schedule, 60), true); // tabs/accordions
        if (window.Webflow && Array.isArray(window.Webflow)) window.Webflow.push(processAll);

        // Optional Finsweet hooks (no-op if Finsweet isn't present)
        window.fsAttributes = window.fsAttributes || [];
        window.fsAttributes.push(['cmsfilter', schedule]);
        window.fsAttributes.push(['cmsload', schedule]);
        window.FinsweetAttributes = window.FinsweetAttributes || [];
        window.FinsweetAttributes.push(['list', schedule]);

        // Manual hook for any custom reveal you build later
        window.StyledText = { refresh: processAll };
      };

      return Object.freeze({ init });
    })();

    //-----------------------------------------------------------------------------
    // HERO SLIDER CLICK NAV
    // Click a non-active slide in .resources-hero-slider-w to navigate to it;
    // click the active slide to advance. Waits on SmartSwiper.ready() so
    // el.swiper is guaranteed to exist (no lazy-null races). Uses pointerup
    // instead of click to avoid the WebKit "non-interactive element" click gate
    // that silently drops taps on plain divs in Safari/iOS Safari.
    //-----------------------------------------------------------------------------
    const HeroSliderClickNav = (() => {
      const SELECTOR = '.resources-hero-slider-w .swiper';

      const bind = (el) => {
        if (el.dataset.clickNavBound === '1') return;
        el.dataset.clickNavBound = '1';

        el.addEventListener(
          'pointerup',
          (e) => {
            const s = el.swiper;
            if (!s || s.allowClick === false) return;
            const slide = e.target.closest('.swiper-slide');
            if (!slide) return;
            const idx = Array.prototype.indexOf.call(s.slides, slide);
            if (idx === -1) return;

            if (idx === s.activeIndex) {
              if (e.target.closest('.button-link')) return;
              e.preventDefault();
              e.stopPropagation();
              s.slideNext();
            } else {
              e.preventDefault();
              e.stopPropagation();
              s.slideTo(idx);
            }
          },
          true,
        );
      };

      const init = () => {
        SmartSwiper.ready(() => {
          const el = Utils.qs(SELECTOR);
          if (el) bind(el);
        });
      };

      return Object.freeze({ init });
    })();

    //-----------------------------------------------------------------------------
    // BUTTON TAP SWEEP (touch only)
    // On (hover: none) devices, tapping a button link plays the fill sweep first
    // (via .is-pressed) and navigates when it finishes. Desktop is untouched.
    //
    //   - Duration comes from the CSS: --tap-sweep-duration on .button-w-bg
    //     (read at click time, so CSS is the only knob).
    //   - Skips: hash links (#request-demo etc.), target="_blank", download,
    //     mailto:/tel:/javascript:, modified clicks, and clicks another handler
    //     already preventDefault-ed.
    //   - bfcache: returning via the back button clears any stuck .is-pressed.
    //
    //   Add to the modules array in section 4:
    //     { name: 'ButtonTapSweep', init: () => ButtonTapSweep.init() },
    //-----------------------------------------------------------------------------
    const ButtonTapSweep = (() => {
      const LINK_SELECTOR = 'a.button-link[href]';
      const PRESSED_CLASS = 'is-pressed';
      const FALLBACK_MS = 325;
      const EXTRA_MS = 90; // safety margin past the transition

      const isTouch = () => window.matchMedia('(hover: none)').matches;

      const shouldIntercept = (a, e) => {
        if (e.defaultPrevented || e.button !== 0) return false;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
        if (a.target && a.target !== '_self') return false;
        if (a.hasAttribute('download')) return false;
        const href = (a.getAttribute('href') || '').trim();
        if (!href || href.startsWith('#')) return false;
        if (/^(javascript|mailto|tel|sms):/i.test(href)) return false;
        return true;
      };

      // First transition-duration on the bg, in ms (computed style is in seconds)
      const sweepMs = (bg) => {
        if (!bg) return FALLBACK_MS;
        const raw = getComputedStyle(bg).transitionDuration.split(',')[0];
        const ms = parseFloat(raw) * 1000;
        return Number.isFinite(ms) && ms >= 0 ? ms : FALLBACK_MS;
      };

      const onClick = (e) => {
        if (!isTouch()) return;
        const a = e.target && e.target.closest ? e.target.closest(LINK_SELECTOR) : null;
        if (!a || !shouldIntercept(a, e)) return;
        e.preventDefault();
        if (a.dataset.sweeping === '1') return; // tap during the sweep: navigation already queued
        a.dataset.sweeping = '1';
        a.classList.add(PRESSED_CLASS);
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.location.href = a.href;
        };
        const bg = a.querySelector('.button-w-bg');
        if (bg) {
          bg.addEventListener('transitionend', (ev) => {
            if (ev.propertyName === 'width') finish();
          });
        }
        setTimeout(finish, sweepMs(bg) + EXTRA_MS);
      };

      const init = () => {
        // Bubble phase on document: element handlers (demo modal, GSAP, analytics)
        // run first, so their preventDefault is respected.
        document.addEventListener('click', onClick);
        // Coming back via the back button can restore the page from bfcache
        // exactly as it was — filled button included. Reset it.
        window.addEventListener('pageshow', (e) => {
          if (!e.persisted) return;
          document.querySelectorAll('.' + PRESSED_CLASS).forEach((el) => {
            el.classList.remove(PRESSED_CLASS);
            delete el.dataset.sweeping;
          });
        });
      };

      return Object.freeze({ init });
    })();

    //=============================================================================
    // 4) INIT
    //-----------------------------------------------------------------------------
    Utils.onReady(() => {
      const modules = [
        { name: 'GoToTop', init: () => GoToTop.init() },
        { name: 'SmartSwiper', init: () => SmartSwiper.init() },
        { name: 'ClickOnLoad', init: () => ClickOnLoad.init() },
        { name: 'NavShrink', init: () => NavShrink.init() },
        { name: 'StyledText', init: () => StyledText.init() },
        { name: 'HeroSliderClickNav', init: () => HeroSliderClickNav.init() },
        { name: 'ButtonTapSweep', init: () => ButtonTapSweep.init() },
      ];

      modules.forEach((m) => Utils.run(m.name, m.init));

      let resourcesSlider;

      SmartSwiper.ready(() => {
        const el = document.querySelector('.resources-hero-slider-w .swiper');
        if (!el) return;

        resourcesSlider = new Swiper(el, {
          effect: 'creative',
          loop: false,
          speed: 600,
          grabCursor: true,
          centeredSlides: true,

          creativeEffect: {
            limitProgress: 1, // how many slides away the transform applies
            prev: {
              translate: ['-20%', 0, -200], // x, y, z — pulled left + pushed back
              scale: 0.85,
            },
            next: {
              translate: ['20%', 0, -200], // x, y, z — pushed right + pushed back
              scale: 0.85,
            },
          },

          navigation: {
            prevEl: '.resources-hero-slider-w .swiper-prev',
            nextEl: '.resources-hero-slider-w .swiper-next',
          },
        });
      });
    });

    //=============================================================================
    // 5) CONSOLE END MESSAGE
    //-----------------------------------------------------------------------------
    try {
      // eslint-disable-next-line no-console
      console.log('%cSite Modules%c ready', START_BADGE, START_BADGE_2);
    } catch (_) {}
  })();
