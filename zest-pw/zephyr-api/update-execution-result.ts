import { getResultsFromJson } from './get-results-from-json';
import { 
    getTestCaseId, 
    getTestExecutionKey, 
    putTestExecution 
} from './zephyr-api';

const testResults = await getResultsFromJson();

export async function updateTestResult() {
    if (process.env.UPDATE_TEST_RESULTS !== 'true') return;

    console.log('Updating test result in Zephyr...');
    
    for (let test of testResults.tests) {
        const testCaseKey = test.testCaseKey;
        // const testCaseId = await getTestCaseId(testCaseKey);
        // const testExecutionKey = await getTestExecutionKey(testCaseId);

        // await putTestExecution(testExecutionKey, stepsWithoutTitle);

        // console.log('testCaseKey:', testCaseKey);
        // console.log('steps:', test.steps);
        console.log('test:', test);
    }
}