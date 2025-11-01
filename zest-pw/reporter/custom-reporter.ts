import type { Reporter, FullConfig, FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import { printTestResults } from '../utils/test-result-formatter';
import { transformTestResults } from '../utils/test-result-transformer';

/**
 * Кастомний репортер для виведення детальних результатів тестів з інформацією про кроки
 */
class CustomReporter implements Reporter {
  private testResults: Array<{
    test: TestCase;
    result: TestResult;
  }> = [];

  async onTestEnd(test: TestCase, result: TestResult) {
    // Зберігаємо результати тестів з кроками для подальшого використання в onEnd
    this.testResults.push({ test, result });
  }

  async onEnd(fullResult: FullResult) {
    // Трансформуємо результати тестів в розширений формат з інформацією про кроки
    const transformedResults = transformTestResults(fullResult, this.testResults);

    // Виводимо результати тестів
    try {
      printTestResults(transformedResults);
    } catch (error) {
      console.error('Помилка при виведенні результатів тестів:', error);
    }
  }
}

export default CustomReporter;

