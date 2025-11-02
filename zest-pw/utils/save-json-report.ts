import * as fs from 'fs';
import * as path from 'path';

/**
 * Saves test results to JSON file
 * 
 * This function creates a JSON report from test results and saves it to the specified directory.
 * If the directory doesn't exist, it will be created automatically.
 * 
 * @param result - Object with test results to be saved
 * @param outputDir - Directory for saving (default 'test-results')
 * @returns Full path to the saved JSON file
 * @throws Error if file cannot be saved
 * 
 * @example
 * const filepath = saveTestResultsToJson(testResults);
 * console.log(`Saved to: ${filepath}`);
 */
export function saveTestResultsToJson(result: any, outputDir: string = 'test-results'): string {
  try {
    // Build the full path to the results directory
    const resultsPath = path.join(process.cwd(), outputDir);
    
    // Create directory if it doesn't exist (recursive: true creates parent dirs too)
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    // Define the output filename
    const filename = `test-results.json`;
    
    // Build the full file path
    const filepath = path.join(resultsPath, filename);

    // Convert object to JSON string with pretty formatting (2 space indentation)
    // and save to file with UTF-8 encoding
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
    
    return filepath;
  } catch (error) {
    console.error(`\n⚠️  Error saving JSON report: ${error}`);
    throw error;
  }
}

