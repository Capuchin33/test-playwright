import { test as base, Page, TestInfo } from '@playwright/test';
import { wrapTestStepWithScreenshots } from '../utils/test-step-wrapper';

// Глобальна змінна для зберігання поточного контексту тесту
let currentTestContext: { testInfo: TestInfo; page: Page } | null = null;

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

// Застосовуємо обгортку до test.step для автоматичних скріншотів
wrapTestStepWithScreenshots(test, () => currentTestContext);

// Примітка: Контекст тесту (page та testInfo) зберігається через custom fixture
// Скріншоти створюються автоматично після кожного test.step()
// Виведення результатів тестів відбувається через кастомний Reporter (custom-reporter.ts)

export { expect } from '@playwright/test';

