import * as path from 'path';
import * as fs from 'fs';
import { parsePlannedStepsFromFile } from './parse-test-steps';
import { saveBase64Screenshot } from './save-screenshots';

/**
 * Форматує та виводить результати тестів після їх завершення
 * Вивід контролюється через змінну оточення PRINT_TEST_RESULTS
 */
export function printTestResults(result: any): void {
  // Перевіряємо чи потрібно виводити результати
  if (process.env.PRINT_TEST_RESULTS !== 'true') {
    return;
  }

  if (!result.tests || !Array.isArray(result.tests)) {
    return;
  }

  console.log('\n=== Деталі по тестах та їх кроках ===');
  
  result.tests.forEach((test: any, testIndex: number) => {
    printTestInfo(test, testIndex);
    
    const userSteps = filterUserSteps(test.steps || []);
    const plannedSteps = getPlannedSteps(test);
    const allSteps = combineSteps(userSteps, plannedSteps);
    
    // Створюємо outputDir точно як Playwright: test-results/{filename}-{test-title}-{project}
    const testFileName = test.location.file.split('/').pop()?.replace('.spec.ts', '') || 'test';
    const sanitizedTitle = test.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    const outputDir = path.join('test-results', `${testFileName}-${sanitizedTitle}-chromium`);
    
    printTestSteps(userSteps, allSteps, test.title, outputDir);
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
function printTestSteps(executedSteps: any[], allSteps: any[], testTitle: string, outputDir?: string): void {
  if (allSteps.length === 0) {
    console.log('  Кроки: немає');
    return;
  }

  const executedCount = executedSteps.length;
  const totalCount = allSteps.length;
  console.log(`  Кроки (${executedCount}/${totalCount}):`);

  allSteps.forEach((step: any, stepIndex: number) => {
    console.log(`    ${stepIndex + 1}. "${step.title}"`);
    
    printStepAttachments(step, testTitle, outputDir, stepIndex + 1);
    console.log(`       statusName: ${step.status}`);
    
    if (step.error) {
      console.log(`       Error: ${step.error.message}`);
    }
  });
}

/**
 * Виводить attachments кроку
 */
function printStepAttachments(step: any, testTitle: string, outputDir: string | undefined, stepNumber: number): void {
  if (!step.attachments || step.attachments.length === 0) {
    return;
  }

  console.log(`       actualResult:`);
  step.attachments.forEach((att: any, index: number) => {
    console.log(`         - ${att.name} (${att.contentType})${att.path ? ` - Path: ${att.path}` : ''}`);
    
    if (att.body) {
      const preview = att.body.substring(0, 50);
      console.log(`           Base64 (${att.bodySize} bytes): ${preview}...`);
      
      // Зберігаємо скріншот на диск, якщо встановлена змінна оточення
      if (process.env.SAVE_SCREENSHOTS === 'true' && att.contentType === 'image/png') {
        try {
          const stepTitle = step.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          // Формат: step_1_title.png
          const filename = `step_${stepNumber}_${stepTitle}.png`;
          
          // Використовуємо outputDir від Playwright або fallback на screenshots/
          let filepath: string;
          if (outputDir) {
            // Зберігаємо в папку тесту, яку створив Playwright
            filepath = saveBase64Screenshot(att.body, filename, outputDir);
          } else {
            // Fallback: зберігаємо в screenshots/ з підпапкою тесту
            filepath = saveBase64Screenshot(att.body, filename, 'screenshots', testTitle);
          }
          
          console.log(`           📸 Saved to: ${filepath}`);
        } catch (error) {
          console.error(`           ⚠️  Error saving screenshot: ${error}`);
        }
      }
    }
  });
}

/**
 * Зберігає результати тестів у JSON файл
 * @param result - Об'єкт з результатами тестів
 * @param outputDir - Директорія для збереження (за замовчуванням 'test-results')
 */
export function saveTestResultsToJson(result: any, outputDir: string = 'test-results'): string {
  try {
    // Створюємо директорію, якщо не існує
    const resultsPath = path.join(process.cwd(), outputDir);
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    // Формуємо назву файлу
    const filename = `test-results.json`;
    const filepath = path.join(resultsPath, filename);

    // Зберігаємо JSON з форматуванням
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');

    console.log(`\n📄 JSON звіт збережено: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error(`\n⚠️  Помилка при збереженні JSON звіту: ${error}`);
    throw error;
  }
}