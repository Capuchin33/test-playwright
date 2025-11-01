import * as path from 'path';
import { parsePlannedStepsFromFile } from './parse-test-steps';

/**
 * Форматує та виводить результати тестів після їх завершення
 */
export function printTestResults(result: any): void {
  if (!result.tests || !Array.isArray(result.tests)) {
    return;
  }

  console.log('\n=== Деталі по тестах та їх кроках ===');
  
  result.tests.forEach((test: any, testIndex: number) => {
    printTestInfo(test, testIndex);
    
    const userSteps = filterUserSteps(test.steps || []);
    const plannedSteps = getPlannedSteps(test);
    const allSteps = combineSteps(userSteps, plannedSteps);
    
    printTestSteps(userSteps, allSteps);
  });

  console.log('\n=== Фінальне завершення ===');
}

/**
 * Виводить загальну інформацію про тест
 */
function printTestInfo(test: any, testIndex: number): void {
  console.log(`\nТест ${testIndex + 1}: ${test.title}`);
  console.log(`  Status: ${test.status || 'unknown'}`);
  
  if (test.error) {
    console.log(`  Помилка тесту: ${test.error.message}`);
  }
}

/**
 * Фільтрує тільки користувацькі кроки (приховує системні хуки)
 */
function filterUserSteps(steps: any[]): any[] {
  return steps.filter((step: any) => {
    const title = step.title || '';
    const lowerTitle = title.toLowerCase();
    
    return (
      !lowerTitle.includes('before hooks') &&
      !lowerTitle.includes('after hooks') &&
      !lowerTitle.includes('worker cleanup') &&
      !lowerTitle.includes('cleanup') &&
      !title.startsWith('hook@') &&
      !title.startsWith('fixture@') &&
      !title.startsWith('pw:api@') &&
      !title.startsWith('test.attach@') &&
      !title.startsWith('test.before') &&
      !title.startsWith('test.after')
    );
  });
}

/**
 * Отримує заплановані кроки з файлу тесту
 */
function getPlannedSteps(test: any): string[] {
  if (!test.location?.file) {
    return [];
  }

  const testFilePath = path.isAbsolute(test.location.file)
    ? test.location.file
    : path.join(process.cwd(), test.location.file);
  
  return parsePlannedStepsFromFile(testFilePath, test.title);
}

/**
 * Об'єднує виконані та невиконані кроки
 */
function combineSteps(executedSteps: any[], plannedSteps: string[]): any[] {
  const executedStepTitles = executedSteps.map((step: any) => step.title);
  const notExecutedSteps = plannedSteps.slice(executedStepTitles.length);

  return [
    ...executedSteps,
    ...notExecutedSteps.map((stepTitle: string) => ({
      title: stepTitle,
      status: 'in progress',
      duration: 0,
      attachments: [],
      error: undefined
    }))
  ];
}

/**
 * Виводить інформацію про кроки тесту
 */
function printTestSteps(executedSteps: any[], allSteps: any[]): void {
  if (allSteps.length === 0) {
    console.log('  Кроки: немає');
    return;
  }

  const executedCount = executedSteps.length;
  const totalCount = allSteps.length;
  console.log(`  Кроки (${executedCount}/${totalCount}):`);

  allSteps.forEach((step: any, stepIndex: number) => {
    console.log(`    ${stepIndex + 1}. "${step.title}"`);
    
    printStepAttachments(step);
    console.log(`       statusName: ${step.status}`);
    
    if (step.error) {
      console.log(`       Error: ${step.error.message}`);
    }
  });
}

/**
 * Виводить attachments кроку
 */
function printStepAttachments(step: any): void {
  if (!step.attachments || step.attachments.length === 0) {
    return;
  }

  console.log(`       actualResult:`);
  step.attachments.forEach((att: any) => {
    console.log(`         - ${att.name} (${att.contentType})${att.path ? ` - Path: ${att.path}` : ''}`);
    
    if (att.body) {
      const preview = att.body.substring(0, 50);
      console.log(`           Base64 (${att.bodySize} bytes): ${preview}...`);
    }
  });
}

