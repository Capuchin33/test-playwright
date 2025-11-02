// Common headers for all requests
const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZEPHYR_API_KEY}`
    };
}

/**
 * Gets test case ID from Zephyr by its key
 * @param testCaseKey - Test case key (e.g., "TC-001")
 * @returns Test case ID or undefined in case of error
 */
export async function getTestCaseId(testCaseKey: string) {
    try {
        const response = await fetch(process.env.ZEPHYR_API_URL + 'testcases/' + testCaseKey,
            {
                method: 'GET',
                headers: getHeaders(),
            }
        );
        // Return only ID
        const data = await response.json();
        const id = data.id;
        console.log('------------------------------------------');
        console.log('Test case key:', testCaseKey);
        return id;
    }
    catch (error) {
        console.error('Error getting test case ID:', error);
    }
}

/**
 * Gets test execution key from Zephyr by test case ID
 * @param testCaseId - Test case ID
 * @returns Test execution key or null in case of error
 */
export async function getTestExecutionKey(testCaseId: string) {
    try {
        const response = await fetch(process.env.ZEPHYR_API_URL + 'testexecutions' + '?testCycle=' + process.env.ZEPHYR_TEST_CYCLE_KEY + '&maxResults=1000',
            {
                method: 'GET',
                headers: getHeaders()
            }
        );

        // Find object in array by testCase.id
        const data = await response.json();
        const testExecution = data.values.find(execution =>
            execution.testCase.id === testCaseId
        );

        if (testExecution) {
            console.log('Test execution key:', testExecution.key);
            return testExecution.key;
        } else {
            console.log('Test execution not found for testCase ID:', testCaseId);
            return null;
        }
    }
    catch (error) {
        console.error('Error getting test execution:', error);
        return null;
    }
}

/**
 * Puts test execution in Zephyr
 * @param testExecutionKey - Test execution key
 * @param steps - Array of test steps to update
 */
export async function putTestExecution(testExecutionKey: string, steps: string[]) {
    try {
        const body = {
            steps: steps
        };

        const response = await fetch(
            process.env.ZEPHYR_API_URL + 'testexecutions/' + testExecutionKey + '/teststeps',
            {
                method: 'PUT',
                body: JSON.stringify(body),
                headers: getHeaders()
            }
        );

        console.log('Successfully sent test steps to Zephyr ✅');
        console.log('------------------------------------------');


        // Add 3 second pause after updating steps
        console.log('Waiting 3 seconds before continuing... ⏳');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    catch (error) {
        console.error('Error updating test steps:', error);
        throw error;
    }
}