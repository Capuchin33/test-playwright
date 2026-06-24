import type { TestInfo, TestType, Page } from '@playwright/test';
import { takeScreenshotAfterStep } from './take-screenshots';

/**
 * Застосовує обгортку до test.step для автоматичного створення скріншотів
 * після кожного кроку тесту
 * 
 * @param test - Об'єкт test з Playwright
 * @param getCurrentContext - Функція для отримання поточного контексту тесту
 */
export function wrapTestStepWithScreenshots(
  test: TestType<any, any>,
  getCurrentContext: () => { testInfo: TestInfo; page: Page } | null
): void {
  const originalTestStep = test.step.bind(test);
  const originalTestStepSkip = (test.step as any).skip?.bind(test);

  const stepWrapper = async function<T>(
    title: string,
    body: (stepInfo: any) => Promise<T> | T,
    options?: { box?: boolean; timeout?: number }
  ): Promise<T> {
    return originalTestStep(title, async (stepInfo: any) => {
      try {
        // Виконуємо крок
        const result = await body(stepInfo);
        
        // Робимо скріншот після успішного виконання кроку
        const context = getCurrentContext();
        if (context?.page && context?.testInfo) {
          await takeScreenshotAfterStep(context.page, stepInfo, context.testInfo, title);
        }
        
        return result;
      } catch (error) {
        // Якщо крок падає, все одно робимо скріншот
        const context = getCurrentContext();
        if (context?.page && context?.testInfo) {
          try {
            await takeScreenshotAfterStep(context.page, { ...stepInfo, error }, context.testInfo, title);
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

  // Замінюємо оригінальний test.step на обгортку
  test.step = stepWrapper as any;
}

