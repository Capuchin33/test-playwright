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
    tests: testResults.map(({ test, result }) => transformTestCase(test, result))
  };
}

/**
 * Трансформує окремий тест-кейс з результатом
 */
function transformTestCase(test: TestCase, result: TestResult): any {
  return {
    testTitle: test.title,
    testCaseKey: transformLocation(test.location),
    _fullPath: test.location?.file,  // Тимчасове поле для enrich-test-results
    steps: result.steps?.map(step => transformStep(step)) || []
  };
}

/**
 * Трансформує інформацію про локацію тесту - повертає назву файлу як testCaseKey
 */
function transformLocation(location: any): string | undefined {
  if (!location || !location.file) {
    return undefined;
  }

  // Витягуємо тільки назву файлу з повного шляху та видаляємо .spec.ts
  const fileName = location.file.split('/').pop();
  return fileName?.replace('.spec.ts', '');
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
  // Збираємо attachments з самого кроку
  let attachments = step.attachments?.map((att: any) => transformAttachment(att)) || [];
  
  // Збираємо attachments з substeps (Playwright створює substeps для testInfo.attach())
  if (step.steps && Array.isArray(step.steps)) {
    step.steps.forEach((substep: any) => {
      if (substep.attachments && substep.attachments.length > 0) {
        const substepAttachments = substep.attachments.map((att: any) => transformAttachment(att));
        attachments = attachments.concat(substepAttachments);
      }
    });
  }
  
  return {
    stepTitle: step.title,
    actualResult: attachments,
    statusName: determineStepStatus(step),
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
    name: att.name, // Тимчасово зберігаємо name, буде замінено на fileName в add-file-names.ts
    contentType: att.contentType, // Тимчасово, буде замінено на image в add-file-names.ts
    body: att.body ? att.body.toString('base64') : undefined
  };
}

