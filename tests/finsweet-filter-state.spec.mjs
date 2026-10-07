import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');

function markup(wrapperClass, markerClass) {
  return `<!doctype html><html><head><style>${css}</style></head><body>
    <label class="w-checkbox filter-radio ${wrapperClass}">
      <div class="w-checkbox-input w-checkbox-input--inputType-custom filter-radio-button ${markerClass}"></div>
      <input type="checkbox" id="video" fs-list-field="type" fs-list-value="Vidéos">
      <span class="filter-radio-label">Vidéos</span>
    </label>
  </body></html>`;
}

test('Finsweet active class displays the active filter without Webflow state', async ({ page }) => {
  await page.setContent(markup('is-list-active', ''));
  await expect(page.locator('.filter-radio-button')).toHaveCSS('opacity', '1');
  await expect(page.locator('.filter-radio-label')).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('stale Webflow checked class cannot display an inactive Finsweet filter', async ({ page }) => {
  await page.setContent(markup('', 'w--redirected-checked'));
  await expect(page.locator('.filter-radio-button')).toHaveCSS('opacity', '0');
  await expect(page.locator('.filter-radio-button')).toHaveCSS('background-image', 'none');
});
