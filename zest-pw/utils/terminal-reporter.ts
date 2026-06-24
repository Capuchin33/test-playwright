import * as path from 'path';
import { saveBase64Screenshot } from './save-screenshots';

/**
 * Форматує та виводить результати тестів після їх завершення
 * Вивід контролюється через змінну оточення PRINT_TEST_RESULTS
 * 
 * Очікує що result вже збагачений запланованими кроками через enrichTestResultsWithPlannedSteps
 */
export function printTestResults(result: any): void {

  if (!result.tests || !Array.isArray(result.tests)) {
    return;
  }

  console.log('\n=== Деталі по тестах та їх кроках ===');
  
  result.tests.forEach((test: any) => {
    printTestInfo(test);
    
    // test.steps вже містить всі кроки (виконані + заплановані) після enrichTestResultsWithPlannedSteps
    const allSteps = test.steps || [];
    const executedSteps = allSteps.filter((step: any) => step.statusName !== 'In Progress');
    
    // Створюємо outputDir точно як Playwright: test-results/{filename}-{test-title}-{project}
    // test.testCaseKey тепер без розширення (наприклад "TC-002")
    const testFileName = test.testCaseKey || 'test';
    const sanitizedTitle = test.testTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    const outputDir = path.join('test-results', `${testFileName}-${sanitizedTitle}-chromium`);
    
    printTestSteps(executedSteps.length, allSteps, test.testTitle, outputDir);
  });

  console.log('\n=== Фінальне завершення ===');
}

/**
 * Виводить загальну інформацію про тест
 */
function printTestInfo(test: any): void {
  console.log(`\n${test.testCaseKey}: ${test.testTitle}`);
}

/**
 * Виводить інформацію про кроки тесту
 */
function printTestSteps(executedCount: number, allSteps: any[], testTitle: string, outputDir?: string): void {
  if (allSteps.length === 0) {
    console.log('  Steps: none');
    return;
  }

  const totalCount = allSteps.length;
  console.log(`  Steps (${executedCount}/${totalCount}):`);

  allSteps.forEach((step: any, stepIndex: number) => {
    const statusEmoji = step.statusName === 'passed' ? 'passed - ✅' : step.statusName === 'failed' ? 'failed - ❌' : step.statusName === 'In Progress' ? 'skipped - ⏭️' : '⏱️';
    console.log(`    ${stepIndex + 1}. ${step.stepTitle}`);
    
    // Спочатку показуємо помилку, якщо є
    if (step.error) {
      console.log(`       ❌ Error: ${step.error.message}`);
      if (step.error.stack) {
        const stackLines = step.error.stack.split('\n').slice(0, 3);
        stackLines.forEach((line: string) => console.log(`          ${line}`));
      }
    }
    
    printStepAttachments(step, testTitle, outputDir, stepIndex + 1);
    console.log(`       Status: ${statusEmoji}`);
    
    // Додаємо порожній рядок після кожного кроку для кращої читабельності
    console.log('');
  });
}

/**
 * Виводить actualResult кроку
 */
function printStepAttachments(step: any, testTitle: string, outputDir: string | undefined, stepNumber: number): void {
  if (!step.actualResult || step.actualResult.length === 0) {
    return;
  }

  console.log(`       Screenshot:`);
  step.actualResult.forEach((att: any, index: number) => {
    const isErrorScreenshot = att.fileName?.includes('ERROR');
    const emoji = isErrorScreenshot ? '💥' : att.image === 'image/png' ? '📸' : '📄';
    
    // Для консолі виводимо "Decode: Base64"
    const displayName = att.image === 'image/png' ? 'Decode: Base64' : att.fileName;
    console.log(`         ${emoji} ${displayName}`);
    
    if (att.body && att.image === 'text/plain') {
      // Для текстових actualResult виводимо повний текст
      console.log(`         ${att.body}`);
    }
    
    // Зберігаємо скріншот на диск, якщо встановлена змінна оточення
    if (att.body && process.env.SAVE_SCREENSHOTS === 'true' && att.image === 'image/png') {
      try {
        // Використовуємо fileName з actualResult
        const filename = att.fileName;
        
        // Використовуємо outputDir від Playwright або fallback на screenshots/
        if (outputDir) {
          // Зберігаємо в папку тесту, яку створив Playwright
          saveBase64Screenshot(att.body, filename, outputDir);
        } else {
          // Fallback: зберігаємо в screenshots/ з підпапкою тесту
          saveBase64Screenshot(att.body, filename, 'screenshots', testTitle);
        }
        
        console.log(`         💾 File saved: locally`);
        console.log(`         📄 File name: ${filename}`);
      } catch (error) {
        console.error(`         ⚠️  Error saving screenshot: ${error}`);
      }
    }
  });
}
