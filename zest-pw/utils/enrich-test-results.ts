import * as path from 'path';
import { parsePlannedStepsFromFile } from './parse-test-steps';

/**
 * Збагачує результати тестів запланованими кроками з файлів
 * Додає кроки які не були виконані (наприклад після падіння тесту)
 */
export function enrichTestResultsWithPlannedSteps(results: any): any {
  if (!results.tests || !Array.isArray(results.tests)) {
    return results;
  }

  return {
    ...results,
    tests: results.tests.map((test: any) => enrichTestWithPlannedSteps(test))
  };
}

/**
 * Збагачує один тест запланованими кроками
 */
function enrichTestWithPlannedSteps(test: any): any {
  const userSteps = filterUserSteps(test.steps || []);
  const plannedSteps = getPlannedSteps(test);
  const allSteps = combineSteps(userSteps, plannedSteps);

  return {
    ...test,
    steps: allSteps
  };
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
      status: 'skipped',
      attachments: []
    }))
  ];
}

