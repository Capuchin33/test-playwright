import { test, expect } from '../zest-pw/fixtures/fixtures'


test.only('Check the get started link', async ({ page }) => {
  
  await test.step('Go to the playwright website', async () => {
    await page.goto('');
    // expect(false).toBeTruthy();
  });

  await test.step('Click the get started link', async () => {
    await page.getByRole('link', { name: 'Get started' }).click();
  });

  await test.step('Check the installation heading', async () => {
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});
