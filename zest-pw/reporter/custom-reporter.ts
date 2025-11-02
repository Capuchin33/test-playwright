import type { Reporter, FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import { processTestResults } from './result-processor';
import { TestResultsStore } from './test-results-store';

/**
 * Custom reporter for outputting detailed test results with step information
 */
class CustomReporter implements Reporter {
  private store = new TestResultsStore();

  async onTestEnd(test: TestCase, result: TestResult) {
    this.store.add(test, result);
  }

  async onEnd(fullResult: FullResult) {
    await processTestResults(fullResult, this.store.getAll());
  }
}

export default CustomReporter;

