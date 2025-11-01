import type { Reporter, FullConfig, FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import { testHooks } from '../hooks/hooks';

/**
 * Кастомний репортер для виклику хуків з доступом до TestResult та кроків
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
    // Створюємо розширений об'єкт результату з інформацією про кроки
    const resultWithSteps = {
      ...fullResult,
      tests: this.testResults.map(({ test, result }) => ({
        title: test.title,
        location: test.location ? {
          file: test.location.file,
          line: test.location.line,
          column: test.location.column
        } : undefined,
        status: result.status,
        duration: result.duration,
        error: result.error ? {
          message: result.error.message,
          stack: result.error.stack
        } : undefined,
        steps: result.steps?.map(step => ({
          title: step.title,
          status: step.error ? 'failed' : ((step as any).status || 'passed'),
          duration: step.duration,
          attachments: step.attachments?.map(att => ({
            name: att.name,
            contentType: att.contentType,
            path: att.path,
            body: att.body ? att.body.toString('base64') : undefined,
            bodySize: att.body ? att.body.length : undefined
          })) || [],
          error: step.error ? {
            message: step.error.message,
            stack: step.error.stack
          } : undefined
        })) || []
      }))
    };

    // Викликаємо onEnd хук з розширеним результатом, що містить інформацію про кроки
    if (testHooks.onEnd) {
      try {
        await testHooks.onEnd(resultWithSteps as any);
      } catch (error) {
        console.error('Помилка в хуку onEnd:', error);
      }
    }
  }
}

export default CustomReporter;

