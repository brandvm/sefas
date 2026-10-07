// Entry point. Existing SEFAS behavior remains isolated in legacy modules while
// new integrations use typed initializers and the wf-template runtime.
import { initEnvironmentSwitcher } from './modules/environment-switcher';
import { initGatedResourceBypass } from './modules/gated-resource-bypass';
import { initLenis } from './modules/lenis';
import { initWistiaPlayer } from './modules/wistia-player';

// Behaviour-preserving imports from release v1.0.0. These scripts already
// guard their own page-specific selectors and therefore no-op where absent.
import './legacy/request-demo.js';
import './legacy/site-modules.js';
import './legacy/accessibility.js';
import './legacy/iubenda-semantics.js';
import './legacy/frame-titles.js';
import './legacy/wistia-privacy.js';

function run(name: string, init: () => void) {
  try {
    init();
  } catch (error) {
    console.error(`[bv] ${name} failed to initialize`, error);
  }
}

function boot() {
  document.documentElement.classList.remove('is-loading');
  run('environment-switcher', initEnvironmentSwitcher);
  run('wistia-player', initWistiaPlayer);
  run('gated-resource-bypass', initGatedResourceBypass);
  run('lenis', initLenis);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
