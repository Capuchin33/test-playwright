/**
 * Утиліта для створення скріншотів після кроків тесту
 */

import type { Page, TestInfo } from "@playwright/test";

/**
 * Робить скріншот після кожного кроку тесту (завжди, незалежно від результату)
 * 
 * Для збереження скріншотів на диск (з base64 результатів):
 * 1. Додайте в .env файл: SAVE_SCREENSHOTS=true
 * 2. Або передайте через команду: SAVE_SCREENSHOTS=true npx playwright test
 */
export async function takeScreenshotAfterStep(
  page: Page,
  stepInfo: any,
  testInfo: TestInfo,
  stepTitle?: string
): Promise<void> {
  try {
    if (page && testInfo) {
      // Формуємо назву файлу на основі назви кроку
      const sanitizedTitle = (stepTitle || stepInfo?.title || 'step').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      // Робимо скріншот без збереження на диск (тільки в буфер)
      const screenshotBuffer = await page.screenshot({ 
        fullPage: true 
      });
      
      // Додаємо скріншот як attachment через testInfo
      // Attachment автоматично прикріплюється до поточного кроку як substep
      await testInfo.attach(stepTitle || stepInfo?.title || 'screenshot', {
        body: screenshotBuffer,
        contentType: 'image/png',
      });
      
      // Примітка: Збереження на диск відбувається в terminal-reporter.ts (якщо PRINT_TEST_RESULTS=true)
      // або можна зберегти з JSON звіту вручну
    }
  } catch (error) {
    console.error('Помилка при створенні скріншота кроку:', error);
  }
}

