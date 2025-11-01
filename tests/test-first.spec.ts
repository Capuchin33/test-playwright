import { test, expect } from '../zest-pw/fixtures/fixtures'

test.only('TC-003: Check the title', async ({ page }) => {
  
  await test.step('Go to the playwright website', async () => {
    await page.goto('https://playwright.dev/');
  });

  await test.step('Check the title', async () => {
    await expect(page).toHaveTitle(/Playwright/);
  });
});

test('TC-004: Check the get started link', async ({ page }) => {
  
  await test.step('Go to the playwright website', async () => {
    await page.goto('https://playwright.dev/');
  });

  await test.step('Click the get started link', async () => {
    await page.getByRole('link', { name: 'Get started' }).click();
  });

  await test.step('Check the installation heading', async () => {
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});
