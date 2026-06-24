import type { FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import { printTestResults } from '../utils/terminal-reporter';
import { transformTestResults } from '../utils/test-result-transformer';
import { saveTestResultsToJson } from '../utils/save-json-report';
import { enrichTestResultsWithPlannedSteps } from '../utils/enrich-test-results';
import { addFileNamesToResults } from '../utils/add-file-names';
import { updateTestResult } from '../zephyr-api/update-execution-result';
import { loadZestConfig } from '../config';

/**
 * Processes test results: transforms, enriches, saves to JSON, prints to console, and updates in Zephyr
 * @param fullResult - Full test execution result from Playwright
 * @param testResults - Array of individual test results with test cases
 */
export async function processTestResults(
  fullResult: FullResult,
  testResults: Array<{ test: TestCase; result: TestResult }>
) {
  // Load configuration
  const config = await loadZestConfig();

  // Transform test results into extended format with step information
  const transformedResults = transformTestResults(fullResult, testResults);

  // Enrich results with planned steps (for JSON and console)
  const enrichedResults = enrichTestResultsWithPlannedSteps(transformedResults);

  // Add formatted file names to actualResult
  const finalResults = addFileNamesToResults(enrichedResults);

  // Save JSON report if enabled
  if (config.reporter.saveJsonReport) {
    try {
      saveTestResultsToJson(finalResults, config.reporter.outputDir);
    } catch (error) {
      console.error('Error saving JSON report:', error);
    }
  }

  // Print test results to console if enabled
  if (config.reporter.printToConsole) {
    try {
      printTestResults(finalResults);
    } catch (error) {
      console.error('Error printing test results:', error);
    }
  }

  // Update test results in Zephyr if enabled
  if (config.zephyr.enabled && config.zephyr.updateResults) {
    try {
      await updateTestResult();
    } catch (error) {
      console.error('Error updating test results:', error);
    }
  }
}

