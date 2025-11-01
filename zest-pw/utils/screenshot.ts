/**
 * Утиліта для створення скріншотів після кроків тесту
 */

import { Page, TestInfo } from "@playwright/test";

/**
 * Робить скріншот після кожного кроку тесту (завжди, незалежно від результату)
 * 
 * Для збереження скріншотів на диск (з base64 результатів) встановіть змінну оточення:
 * SAVE_SCREENSHOTS=true npx playwright test
 */
export async function takeScreenshotAfterStep(
  page: Page,
  stepInfo: any,
  testInfo: TestInfo
): Promise<void> {
  try {
    if (page && testInfo) {
      // Формуємо назву файлу на основі назви кроку
      const stepTitle = stepInfo?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'step';
      
      // Робимо скріншот без збереження на диск (тільки в буфер)
      const screenshotBuffer = await page.screenshot({ 
        fullPage: true 
      });
      
      // Додаємо скріншот як attachment через testInfo
      // Attachment автоматично прикріплюється до поточного кроку як substep
      await testInfo.attach(`step-screenshot-${stepTitle}`, {
        body: screenshotBuffer,
        contentType: 'image/png',
      });
      
      // Примітка: Збереження на диск відбувається в test-result-formatter.ts
      // з base64 результатів тестів, якщо SAVE_SCREENSHOTS=true
    }
  } catch (error) {
    console.error('Помилка при створенні скріншота кроку:', error);
  }
}

