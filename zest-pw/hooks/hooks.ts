import type {
  Reporter, FullConfig, Suite, TestCase, TestResult, FullResult, TestStep
} from '@playwright/test/reporter';
import * as path from 'path';
import { parsePlannedStepsFromFile } from '../utils/parse-test-steps';

export const testHooks = {

  /**
   * Виконується після кожного кроку тесту
   */
  onStepEnd: async (testInfo: TestCase, result: any, stepInfo: any) => {

  },

  /**
   * Альтернативна назва для onAfterAll
   * Викликається після завершення всіх тестів з повним результатом
   */
  onEnd: async (result: any) => {
    // Виводимо інформацію про кроки, якщо вони є
    if (result.tests && Array.isArray(result.tests)) {
      console.log('\n=== Деталі по тестах та їх кроках ===');
      result.tests.forEach((test: any, testIndex: number) => {
        console.log(`\nТест ${testIndex + 1}: ${test.title}`);
        console.log(`  Status: ${test.status || 'unknown'}`);
        if (test.error) {
          console.log(`  Помилка тесту: ${test.error.message}`);
        }

        // // Виводимо attachments тесту
        // if (test.attachments && test.attachments.length > 0) {
        //   console.log(`  Attachments тесту (${test.attachments.length}):`);
        //   test.attachments.forEach((att: any, attIndex: number) => {
        //     console.log(`    ${attIndex + 1}. ${att.name} (${att.contentType})${att.path ? ` - Path: ${att.path}` : ''}`);
        //     if (att.body) {
        //       console.log(`       ${att.body}`);
        //     }
        //   });
        // }

        // Фільтруємо тільки користувацькі кроки (приховуємо системні хуки)
        const userSteps = (test.steps || []).filter((step: any) => {
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

        // Отримуємо заплановані кроки з файлу тесту
        let plannedSteps: string[] = [];
        if (test.location?.file) {
          const testFilePath = path.isAbsolute(test.location.file) 
            ? test.location.file 
            : path.join(process.cwd(), test.location.file);
          plannedSteps = parsePlannedStepsFromFile(testFilePath, test.title);
        }

        // Визначаємо виконані кроки
        const executedStepTitles = userSteps.map((step: any) => step.title);

        // Знаходимо невиконані кроки
        const notExecutedSteps = plannedSteps.slice(executedStepTitles.length);

        // Об'єднуємо виконані та невиконані кроки
        const allSteps = [
          ...userSteps,
          ...notExecutedSteps.map((stepTitle: string) => ({
            title: stepTitle,
            status: 'in progress',
            duration: 0,
            attachments: [],
            error: undefined
          }))
        ];

        if (allSteps.length > 0) {
          const executedCount = userSteps.length;
          const totalCount = allSteps.length;
          console.log(`  Кроки (${executedCount}/${totalCount}):`);
          allSteps.forEach((step: any, stepIndex: number) => {
            console.log(`    ${stepIndex + 1}. "${step.title}"`);

            // Виводимо attachments кроку (тільки для виконаних кроків)
            if (step.attachments && step.attachments.length > 0) {
              console.log(`       actualResult:`);
              step.attachments.forEach((att: any, attIndex: number) => {
                console.log(`         - ${att.name} (${att.contentType})${att.path ? ` - Path: ${att.path}` : ''}`);
                if (att.body) {
                  // body тепер містить base64 рядок
                  const preview = att.body.substring(0, 50);
                  console.log(`           Base64 (${att.bodySize} bytes): ${preview}...`);
                }
              });
            }
            console.log(`       statusName: ${step.status}`);

            if (step.error) {
              console.log(`       Error: ${step.error.message}`);
            }
          });
        } else {
          console.log('  Кроки: немає');
        }
      });
    }

    console.log('\n=== Фінальне завершення ===');
  },
};

