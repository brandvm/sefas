
  (function () {
    var HASH = '#request-demo';
    var SELECTOR = '[request-a-demo]';

    function openDemo() {
      var el = document.querySelector(SELECTOR);
      if (!el) return false;
      el.click();
      return true;
    }

    // Retry briefly in case GSAP/Webflow hasn't bound its listeners yet
    function openDemoWhenReady(attempt) {
      attempt = attempt || 0;
      if (openDemo() || attempt > 20) return; // ~2s max
      setTimeout(function () {
        openDemoWhenReady(attempt + 1);
      }, 100);
    }

    function maybeOpen() {
      if (window.location.hash.toLowerCase() === HASH) {
        openDemoWhenReady();
      }
    }

    // On initial load
    if (document.readyState === 'complete') {
      maybeOpen();
    } else {
      window.addEventListener('load', maybeOpen);
    }

    // If someone lands on the page and later hits a #request-demo link
    window.addEventListener('hashchange', maybeOpen);
  })();
