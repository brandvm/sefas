import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8');

const markup = `<!doctype html><html><body>
  <div class="resource-form-block w-form">
    <form id="wf-form-Gated-Form" style="display:block">
      <input name="Email" type="email">
      <button type="submit">Access Resource</button>
    </form>
    <div class="resources-form-success-w w-form-done" style="display:none" aria-hidden="true">
      <style>wistia-player[media-id='example123']:not(:defined) { display:block; padding-top:56.25%; }</style>
      <script src="https://fast.wistia.com/embed/example123.js" type="module"><\/script>
    </div>
  </div>
  <script>${js}<\/script>
</body></html>`;

async function open(page, search = '', html = markup) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    if (route.request().isNavigationRequest()) {
      return route.fulfill({ contentType: 'text/html', body: html });
    }
    return route.fulfill({ contentType: 'text/javascript', body: '' });
  });
  await page.goto(`https://www.sefasinnovation.fr/ressources/example${search}`);
  return errors;
}

test('ungated=1 reveals the resource without submitting the form', async ({ page }) => {
  const errors = await open(page, '?ungated=1');

  await expect(page.locator('#wf-form-Gated-Form')).toBeHidden();
  await expect(page.locator('#wf-form-Gated-Form')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.w-form-done')).toBeVisible();
  await expect(page.locator('.w-form-done')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('wistia-player[media-id="example123"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the normal resource URL remains gated', async ({ page }) => {
  const errors = await open(page);

  await expect(page.locator('#wf-form-Gated-Form')).toBeVisible();
  await expect(page.locator('.w-form-done')).toBeHidden();
  await expect(page.locator('wistia-player')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the resource wrapper works when Webflow gives the form a different ID', async ({ page }) => {
  const variant = markup.replace('id="wf-form-Gated-Form"', 'id="wf-form-Resource-Access"');
  const errors = await open(page, '?ungated=1', variant);

  await expect(page.locator('#wf-form-Resource-Access')).toBeHidden();
  await expect(page.locator('.w-form-done')).toBeVisible();
  expect(errors).toEqual([]);
});
