import type { FullResult, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Transforms test results from Playwright Reporter API into extended format with detailed information about steps and attachments
 * 
 * @param fullResult - Full test execution result from Playwright containing overall status and statistics
 * @param testResults - Array of individual test results, each containing test case information and execution result
 * @returns Object with 'tests' array containing transformed test cases
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
 * Transforms individual test case with its result
 * 
 * @param test - Test case information from Playwright
 * @param result - Test execution result containing steps and status
 * @returns Transformed test object with title, key, and steps
 */
function transformTestCase(test: TestCase, result: TestResult): any {
  return {
    testTitle: test.title,
    testCaseKey: transformLocation(test.location),
    _fullPath: test.location?.file,  // Used in enrich-test-results.ts to find planned test steps
    steps: result.steps?.map(step => transformStep(step)) || []
  };
}

/**
 * Transforms test location information - returns file name as testCaseKey
 * 
 * @param location - Location object containing file path information
 * @returns Test case key (file name without .spec.ts extension) or undefined
 */
function transformLocation(location: any): string | undefined {
  if (!location || !location.file) {
    return undefined;
  }

  // Extract only the file name from the full path and remove .spec.ts extension
  const fileName = location.file.split('/').pop();
  return fileName?.replace('.spec.ts', '');
}

/**
 * Transforms error information
 * 
 * @param error - Error object from test execution
 * @returns Object with error message and stack trace, or undefined if no error
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
 * Transforms test step with attachments
 * 
 * @param step - Step object from test execution containing title, status, and attachments
 * @returns Transformed step object with title, actual results, status, and error (if any)
 */
function transformStep(step: any): any {
  // Collect attachments from the step itself
  let attachments = step.attachments?.map((att: any) => transformAttachment(att)) || [];
  
  // Collect attachments from substeps (Playwright creates substeps for testInfo.attach())
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
 * Determines step status
 * 
 * @param step - Step object from test execution
 * @returns Step status ('failed' if has error, otherwise step.status or 'passed')
 */
function determineStepStatus(step: any): string {
  if (step.error) {
    return 'failed';
  }
  return step.status || 'passed';
}

/**
 * Transforms attachment (screenshot, video, etc.)
 * 
 * @param att - Attachment object containing name, content type, and body
 * @returns Transformed attachment with fileName, image (content type), and base64 encoded body
 */
function transformAttachment(att: any): any {
  return {
    fileName: att.name,
    image: att.contentType,
    body: att.body ? att.body.toString('base64') : undefined
  };
}

