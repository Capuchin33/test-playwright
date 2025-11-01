import { test as base } from '@playwright/test';
import { testHooks } from '../hooks/hooks';
import { takeScreenshotAfterStep } from '../utils/screenshot';
import * as fs from 'fs';
import * as path from 'path';
import { AsyncLocalStorage } from 'async_hooks';

// // Створюємо директорію для скріншотів
// const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
// if (!fs.existsSync(screenshotsDir)) {
//   fs.mkdirSync(screenshotsDir, { recursive: true });
// }

// Використовуємо AsyncLocalStorage для безпечного зберігання контексту тесту
// Це безпечно працює при паралельному виконанні тестів
interface TestContext {
  testInfo: any;
  page: any;
}

const testContextStorage = new AsyncLocalStorage<TestContext>();

// Розширюємо базовий test
export const test = base.extend({});

// Створюємо обгортку для test.step з автоматичними скріншотами
const originalTestStep = test.step.bind(test);
const originalTestStepSkip = (test.step as any).skip?.bind(test);

const stepWrapper = async function<T>(title: string, body: (stepInfo: any) => Promise<T> | T, options?: { box?: boolean, timeout?: number }): Promise<T> {
  return originalTestStep(title, async (stepInfo) => {
    try {
      // // Викликаємо хук перед кроком
      // if (testHooks.onStep) {
      //   await testHooks.onStep();
      // }
      
      // Виконуємо крок
      const result = await body(stepInfo);
      
      // Отримуємо поточний контекст тесту для доступу до page та робимо скріншот
      const context = testContextStorage.getStore();
      if (context?.page && context?.testInfo) {
        await takeScreenshotAfterStep(context.page, stepInfo, context.testInfo);
      }
      
      // Викликаємо хук після кроку (після додавання скріншота, щоб бачити attachments)
      if (testHooks.onStepEnd && context?.testInfo) {
        await testHooks.onStepEnd(context.testInfo, result, stepInfo);
      }
      
      return result;
    } catch (error) {
      // Якщо крок падає, все одно робимо скріншот
      const context = testContextStorage.getStore();
      if (context?.page && context?.testInfo) {
        try {
          await takeScreenshotAfterStep(context.page, { ...stepInfo, error }, context.testInfo);
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

// Глобальний хук після кожного тесту
// Виконується завжди, навіть якщо тест падає
test.afterEach(async ({ page }, testInfo) => {
  // Скріншоти робляться тільки після кожного кроку, а не після тесту
  
  // // Викликаємо інші методи після тесту
  // try {
  //   if (testHooks.onAfterEach) {
  //     await testHooks.onAfterEach();
  //   }
  //   if (testHooks.onTestEnd) {
  //     await testHooks.onTestEnd();
  //   }
  // } catch (error) {
  //   console.error('Помилка в хуках після тесту:', error);
  // }
});

// Глобальний хук перед кожним тестом
test.beforeEach(async ({ page }, testInfo) => {
  // Безпечно зберігаємо контекст через AsyncLocalStorage для всього тесту
  // Це працює навіть при паралельному виконанні тестів
  testContextStorage.enterWith({ testInfo, page });
  
  // if (testHooks.onBeforeEach) {
  //   await testHooks.onBeforeEach();
  // }
  // if (testHooks.onTestBegin) {
  //   await testHooks.onTestBegin();
  // }
});

// Примітка: onEnd хук викликається через кастомний Reporter (custom-reporter.ts)
// який має доступ до FullResult після завершення всіх тестів

export { expect } from '@playwright/test';

