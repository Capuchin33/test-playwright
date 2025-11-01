import { test as base } from '@playwright/test';
import { takeScreenshotAfterStep } from '../utils/screenshot';

// Глобальна змінна для зберігання поточного контексту тесту
let currentTestContext: { testInfo: any; page: any } | null = null;

// Розширюємо базовий test з кастомним fixture для зберігання контексту
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // Зберігаємо контекст перед використанням page
    currentTestContext = { testInfo, page };
    await use(page);
    // Очищаємо контекст після використання
    currentTestContext = null;
  },
});

// Створюємо обгортку для test.step з автоматичними скріншотами
const originalTestStep = test.step.bind(test);
const originalTestStepSkip = (test.step as any).skip?.bind(test);

const stepWrapper = async function<T>(title: string, body: (stepInfo: any) => Promise<T> | T, options?: { box?: boolean, timeout?: number }): Promise<T> {
  return originalTestStep(title, async (stepInfo) => {
    try {
      // Виконуємо крок
      const result = await body(stepInfo);
      
      // Робимо скріншот після кроку
      if (currentTestContext?.page && currentTestContext?.testInfo) {
        await takeScreenshotAfterStep(currentTestContext.page, stepInfo, currentTestContext.testInfo);
      }
      
      return result;
    } catch (error) {
      // Якщо крок падає, все одно робимо скріншот
      if (currentTestContext?.page && currentTestContext?.testInfo) {
        try {
          await takeScreenshotAfterStep(currentTestContext.page, { ...stepInfo, error }, currentTestContext.testInfo);
        } catch (screenshotError) {
          console.error('Помилка при створенні скріншота після помилки кроку:', screenshotError);
        }
      }
      throw error;
    }
  }, options);
};

// Додаємо метод skip, якщо він існує
if (originalTestStepSkip) {
  (stepWrapper as any).skip = originalTestStepSkip;
}

test.step = stepWrapper as any;

// Примітка: Контекст тесту (page та testInfo) зберігається автоматично
// через розширений fixture 'page' (див. вище)
// Скріншоти створюються автоматично після кожного test.step()
// Виведення результатів тестів відбувається через кастомний Reporter (custom-reporter.ts)

export { expect } from '@playwright/test';

