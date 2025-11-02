import type { TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Store for collecting test results during test execution
 * 
 * Methods:
 * - add(test, result) - Adds a test result to the store
 * - getAll() - Gets all stored test results
 * - clear() - Clears all stored test results
 */
export class TestResultsStore {
  private results: Array<{ test: TestCase; result: TestResult }> = [];

  /**
   * Adds a test result to the store
   * @param test - Test case information
   * @param result - Test execution result
   */
  add(test: TestCase, result: TestResult): void {
    this.results.push({ test, result });
  }

  /**
   * Gets all stored test results
   * @returns Array of test results with test cases
   */
  getAll(): Array<{ test: TestCase; result: TestResult }> {
    return this.results;
  }

  /**
   * Clears all stored test results
   */
  clear(): void {
    this.results = [];
  }
}

