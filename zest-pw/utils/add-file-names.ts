/**
 * Додає форматовані імена файлів до actualResult кожного кроку
 */
export function addFileNamesToResults(results: any): any {
  if (!results.tests || !Array.isArray(results.tests)) {
    return results;
  }

  return {
    ...results,
    tests: results.tests.map((test: any) => ({
      ...test,
      steps: test.steps?.map((step: any, stepIndex: number) => ({
        ...step,
        actualResult: step.actualResult?.map((att: any) => {
          // Якщо це скріншот, генеруємо форматовану назву файлу
          if (att.contentType === 'image/png') {
            const stepTitle = step.stepTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const isError = att.name?.includes('ERROR');
            const errorSuffix = isError ? '_ERROR' : '';
            const fileName = `step_${stepIndex + 1}_${stepTitle}${errorSuffix}.png`;
            
            return {
              fileName: fileName,
              image: att.contentType,
              body: att.body
            };
          }
          
          // Для інших типів attachments залишаємо як є, але перейменовуємо name в fileName
          return {
            fileName: att.name,
            image: att.contentType,
            body: att.body
          };
        }) || []
      })) || []
    }))
  };
}

