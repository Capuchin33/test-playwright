import type { FullResult, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Трансформує результати тестів з Playwright Reporter API
 * в розширений формат з детальною інформацією про кроки та attachments
 */
export function transformTestResults(
  fullResult: FullResult,
  testResults: Array<{ test: TestCase; result: TestResult }>
): any {
  return {
    ...fullResult,
    tests: testResults.map(({ test, result }) => transformTestCase(test, result))
  };
}

/**
 * Трансформує окремий тест-кейс з результатом
 */
function transformTestCase(test: TestCase, result: TestResult): any {
  return {
    title: test.title,
    location: transformLocation(test.location),
    status: result.status,
    duration: result.duration,
    error: transformError(result.error),
    steps: result.steps?.map(step => transformStep(step)) || []
  };
}

/**
 * Трансформує інформацію про локацію тесту
 */
function transformLocation(location: any): any {
  if (!location) {
    return undefined;
  }

  return {
    file: location.file,
    line: location.line,
    column: location.column
  };
}

/**
 * Трансформує інформацію про помилку
 */
function transformError(error: any): any {
  if (!error) {
    return undefined;
  }

  return {
    message: error.message,
    stack: error.stack
  };
}

/**
 * Трансформує крок тесту з attachments
 */
function transformStep(step: any): any {
  return {
    title: step.title,
    status: determineStepStatus(step),
    duration: step.duration,
    attachments: step.attachments?.map((att: any) => transformAttachment(att)) || [],
    error: transformError(step.error)
  };
}

/**
 * Визначає статус кроку
 */
function determineStepStatus(step: any): string {
  if (step.error) {
    return 'failed';
  }
  return step.status || 'passed';
}

/**
 * Трансформує attachment (скріншот, відео, тощо)
 */
function transformAttachment(att: any): any {
  return {
    name: att.name,
    contentType: att.contentType,
    path: att.path,
    body: att.body ? att.body.toString('base64') : undefined,
    bodySize: att.body ? att.body.length : undefined
  };
}

