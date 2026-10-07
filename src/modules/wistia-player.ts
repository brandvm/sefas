const PLAYER_URL = 'https://fast.wistia.net/player.js';

export function initWistiaPlayer() {
  if (document.querySelector('script[src*="fast.wistia.net/player.js"], script[src*="fast.wistia.com/player.js"]')) {
    return;
  }

  const script = document.createElement('script');
  script.src = PLAYER_URL;
  script.async = true;
  script.dataset.cmpAb = '2';
  document.head.appendChild(script);
}
