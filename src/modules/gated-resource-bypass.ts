const BYPASS_PARAMETER = 'ungated';
const BYPASS_VALUE = '1';

function ensureWistiaPlayers(scope: ParentNode) {
  const mediaIds = new Set<string>();

  scope.querySelectorAll<HTMLElement>('wistia-player[media-id]').forEach((player) => {
    const id = player.getAttribute('media-id');
    if (id) mediaIds.add(id);
  });

  scope.querySelectorAll<HTMLStyleElement>('style').forEach((style) => {
    const match = style.textContent.match(/wistia-player\[media-id=['"]([a-z0-9]+)['"]\]/i);
    if (match) mediaIds.add(match[1]);
  });

  scope.querySelectorAll<HTMLScriptElement>('script[src*="fast.wistia.com/embed/"]').forEach((script) => {
    const match = (script.getAttribute('src') || '').match(/embed\/([a-z0-9]+)\.js/i);
    if (match) mediaIds.add(match[1]);
  });

  mediaIds.forEach((id) => {
    if (scope.querySelector(`wistia-player[media-id="${id}"]`)) return;

    const player = document.createElement('wistia-player');
    player.setAttribute('media-id', id);
    player.setAttribute('aspect', '1.7777777777777777');

    const anchor = [...scope.querySelectorAll<HTMLStyleElement>('style')].find((style) =>
      style.textContent.includes(`media-id='${id}'`) || style.textContent.includes(`media-id="${id}"`),
    );
    if (anchor) anchor.insertAdjacentElement('afterend', player);
    else scope.appendChild(player);
  });
}

export function initGatedResourceBypass() {
  const query = new URLSearchParams(window.location.search);
  if (query.get(BYPASS_PARAMETER) !== BYPASS_VALUE) return;

  const resourceWrapper = document.querySelector<HTMLElement>('.resource-form-block.w-form, [data-gated-resource].w-form');
  const form = resourceWrapper?.querySelector<HTMLFormElement>('form')
    ?? document.querySelector<HTMLFormElement>('#wf-form-Gated-Form, form[data-name="Gated Form"]');
  if (!form) return;

  const wrapper = resourceWrapper ?? form.closest('.w-form');
  const success = wrapper?.querySelector<HTMLElement>('.w-form-done');
  if (!success) return;

  form.style.display = 'none';
  form.setAttribute('aria-hidden', 'true');
  success.style.display = 'block';
  success.removeAttribute('aria-hidden');
  ensureWistiaPlayers(success);
}
