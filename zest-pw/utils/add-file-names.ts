/**
 * Adds formatted file names to actualResult of each step
 * Regenerates fileName for PNG screenshots based on step title and index
 * 
 * @param results - Test results object with tests and steps
 * @returns Updated results with formatted file names
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
          // If it's a PNG screenshot, generate a formatted file name
          if (att.image === 'image/png') {
            const stepTitle = step.stepTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const isError = att.fileName?.includes('ERROR');
            const errorSuffix = isError ? '_ERROR' : '';
            const fileName = `step_${stepIndex + 1}_${stepTitle}${errorSuffix}.png`;
            
            return {
              ...att,
              fileName: fileName
            };
          }
          
          // For other attachment types, keep as is
          return att;
        }) || []
      })) || []
    }))
  };
}

