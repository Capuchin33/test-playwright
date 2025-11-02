import { test, expect } from '../zest-pw/fixtures/fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('https://playwright.dev/');
});

test('Check the title', async ({ page }) => {
  
  await test.step('Go to the playwright website', async () => {
    
  });

  await test.step('Check the title', async () => {
    await expect(page).toHaveTitle(/Playwright/);
  });
});

test('Check the get started link', async ({ page }) => {
  
  await test.step('Go to the playwright website', async () => {
    
  });

  await test.step('Click the get started link', async () => {
    await page.getByRole('link', { name: 'Get started' }).click();
  });

  await test.step('Check the installation heading', async () => {
    // expect(false).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});
