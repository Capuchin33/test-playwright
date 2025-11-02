import type { Reporter, FullConfig, FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import { printTestResults } from '../utils/test-result-formatter';
import { transformTestResults } from '../utils/test-result-transformer';
import { saveTestResultsToJson } from '../utils/save-json-report';
import { enrichTestResultsWithPlannedSteps } from '../utils/enrich-test-results';
import { addFileNamesToResults } from '../utils/add-file-names';

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

    // Збагачуємо результати запланованими кроками (для JSON і консолі)
    const enrichedResults = enrichTestResultsWithPlannedSteps(transformedResults);

    // Додаємо форматовані імена файлів до actualResult
    const finalResults = addFileNamesToResults(enrichedResults);

    // Автоматично зберігаємо JSON звіт (з усіма запланованими кроками)
    try {
      saveTestResultsToJson(finalResults);
    } catch (error) {
      console.error('Помилка при збереженні JSON звіту:', error);
    }

    // Виводимо результати тестів в консоль (контролюється через PRINT_TEST_RESULTS в .env)
    try {
      printTestResults(finalResults);
    } catch (error) {
      console.error('Помилка при виведенні результатів тестів:', error);
    }
  }
}

export default CustomReporter;

