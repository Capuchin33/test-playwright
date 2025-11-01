/**
 * Утиліта для створення скріншотів після кроків тесту
 */

/**
 * Робить скріншот після кожного кроку тесту (завжди, незалежно від результату)
 */
export async function takeScreenshotAfterStep(
  page: any,
  stepInfo: any,
  testInfo: any
): Promise<void> {
  try {
    if (page) {
      // // Формуємо назву файлу на основі назви тесту, кроку та статусу
      const stepTitle = stepInfo?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'step';
      
      // Робимо скріншот без збереження на диск (тільки в буфер)
      const screenshotBuffer = await page.screenshot({ 
        fullPage: true 
      });
      
      // Додаємо скріншот як attachment до кроку
      await stepInfo.attach(`step-screenshot-${stepTitle}`, {
        body: screenshotBuffer,
        contentType: 'image/png',
      });
    }
  } catch (error) {
    console.error('Помилка при створенні скріншота кроку:', error);
  }
}

