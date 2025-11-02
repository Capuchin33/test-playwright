import { getResultsFromJson } from './get-results-from-json';
import { 
    getTestCaseId, 
    getTestExecutionKey, 
    putTestExecution 
} from './zephyr-api';

const testResults = await getResultsFromJson();

export async function updateTestResult() {
    console.log('Updating test result in Zephyr...');
    
    // Iterate over object with testCaseKey as keys
    for (const testCaseKey in testResults) {
        const steps = testResults[testCaseKey];
        const testCaseId = await getTestCaseId(testCaseKey);
        const testExecutionKey = await getTestExecutionKey(testCaseId);

        await putTestExecution(testExecutionKey, steps);
    }
}