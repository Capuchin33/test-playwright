import * as path from 'path';
import { saveBase64Screenshot } from './save-screenshots';

/**
 * Форматує та виводить результати тестів після їх завершення
 * Вивід контролюється через змінну оточення PRINT_TEST_RESULTS
 * 
 * Очікує що result вже збагачений запланованими кроками через enrichTestResultsWithPlannedSteps
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
    
    // test.steps вже містить всі кроки (виконані + заплановані) після enrichTestResultsWithPlannedSteps
    const allSteps = test.steps || [];
    const executedSteps = allSteps.filter((step: any) => step.status !== 'skipped');
    
    // Створюємо outputDir точно як Playwright: test-results/{filename}-{test-title}-{project}
    const testFileName = test.location.file.split('/').pop()?.replace('.spec.ts', '') || 'test';
    const sanitizedTitle = test.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    const outputDir = path.join('test-results', `${testFileName}-${sanitizedTitle}-chromium`);
    
    printTestSteps(executedSteps.length, allSteps, test.title, outputDir);
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
 * Виводить інформацію про кроки тесту
 */
function printTestSteps(executedCount: number, allSteps: any[], testTitle: string, outputDir?: string): void {
  if (allSteps.length === 0) {
    console.log('  Кроки: немає');
    return;
  }

  const totalCount = allSteps.length;
  console.log(`  Кроки (${executedCount}/${totalCount}):`);

  allSteps.forEach((step: any, stepIndex: number) => {
    const statusEmoji = step.status === 'passed' ? '✅' : step.status === 'failed' ? '❌' : step.status === 'skipped' ? '⏭️' : '⏱️';
    console.log(`    ${stepIndex + 1}. "${step.title}" ${statusEmoji}`);
    
    // Спочатку показуємо помилку, якщо є
    if (step.error) {
      console.log(`       ❌ Error: ${step.error.message}`);
      if (step.error.stack) {
        const stackLines = step.error.stack.split('\n').slice(0, 3);
        stackLines.forEach((line: string) => console.log(`          ${line}`));
      }
    }
    
    printStepAttachments(step, testTitle, outputDir, stepIndex + 1);
    console.log(`       statusName: ${step.status}`);
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
    const isErrorScreenshot = att.name.includes('ERROR');
    const emoji = isErrorScreenshot ? '💥' : att.contentType === 'image/png' ? '📸' : '📄';
    console.log(`         ${emoji} ${att.name} (${att.contentType})${att.path ? ` - Path: ${att.path}` : ''}`);
    
    if (att.body) {
      // Для текстових attachments виводимо повний текст
      if (att.contentType === 'text/plain') {
        console.log(`           ${att.body}`);
      } else {
        const preview = att.body.substring(0, 50);
        console.log(`           Base64 (${att.bodySize} bytes): ${preview}...`);
      }
      
      // Зберігаємо скріншот на диск, якщо встановлена змінна оточення
      if (process.env.SAVE_SCREENSHOTS === 'true' && att.contentType === 'image/png') {
        try {
          const stepTitle = step.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          // Формат: step_1_title.png або step_1_title_ERROR.png
          const errorSuffix = isErrorScreenshot ? '_ERROR' : '';
          const filename = `step_${stepNumber}_${stepTitle}${errorSuffix}.png`;
          
          // Використовуємо outputDir від Playwright або fallback на screenshots/
          let filepath: string;
          if (outputDir) {
            // Зберігаємо в папку тесту, яку створив Playwright
            filepath = saveBase64Screenshot(att.body, filename, outputDir);
          } else {
            // Fallback: зберігаємо в screenshots/ з підпапкою тесту
            filepath = saveBase64Screenshot(att.body, filename, 'screenshots', testTitle);
          }
          
          console.log(`           💾 Saved to: ${filepath}`);
        } catch (error) {
          console.error(`           ⚠️  Error saving screenshot: ${error}`);
        }
      }
    }
  });
}
