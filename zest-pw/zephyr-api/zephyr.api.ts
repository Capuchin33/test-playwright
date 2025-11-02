
let buffer = {};

// Common headers for all requests
const getHeaders = async () => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZEPHYR_API_KEY}`
    };
}

const getTestCycle = async (testCaseKey: string) => {
    try {
        const response = await fetch(process.env.ZEPHYR_API_URL + 'testcases/' + testCaseKey,
            {
                method: 'GET',
                headers: await getHeaders(),
            }
        );
        // Return only ID
        const data = await response.json();
        const id = data.id;
        console.log('------------------------------------------');
        console.log('Test case key:', testCaseKey);
        // console.log('id:', id);
        return id;
    }
    catch (error) {
        console.error('Error updating test cycle:', error);
    }
}

const getTestExecutionKey = async (testCaseId: string) => {
    try {
        const response = await fetch(process.env.ZEPHYR_API_URL + 'testexecutions' + '?testCycle=' + process.env.ZEPHYR_TEST_CYCLE_KEY + '&maxResults=1000',
            {
                method: 'GET',
                headers: await getHeaders()
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

const updateTestSteps = async (testExecutionKey: string, steps: any[]) => {
    try {
        const body = {
            steps: steps
        };

        // console.log('Sending test steps to Zephyr:', JSON.stringify(body, null, 2));

        const response = await fetch(
            process.env.ZEPHYR_API_URL + 'testexecutions/' + testExecutionKey + '/teststeps',
            {
                method: 'PUT',
                body: JSON.stringify(body),
                headers: await getHeaders()
            }
        );

        console.log('Successfully sent test steps to Zephyr ✅');
        console.log('------------------------------------------');


        // Add 3 second pause after updating steps
        console.log('Waiting 3 seconds before continuing... ⏳');
        await new Promise(resolve => setTimeout(resolve, 3000));
        // console.log('Pause completed, continuing execution...');
        // const data = await response.json();
        // return data;
    }
    catch (error) {
        console.error('Error updating test steps:', error);
        throw error;
    }
}

export async function createBuffer(page: any, testInfo: any) {

    const testCaseKey = testInfo.titlePath[1].split(':')[0];
    const status = testInfo.status === 'passed' ? 'Pass' : 'Fail';
    // Create screenshot in base64 format
    let screenshotBase64 = null;
    try {
        const screenshot = await page.screenshot({ fullPage: true, type: 'png' });
        screenshotBase64 = screenshot.toString('base64');
    } catch (screenshotError) {
        console.error('Error taking screenshot:', screenshotError);
    }

    let htmlResult = testInfo.title + (status === 'Pass' ? ' - Test passed successfully' : ` - Test failed: ${testInfo.error?.message || 'Unknown error'}`);

    if (screenshotBase64) {
        htmlResult += `<br><br><img src="data:image/png;base64,${screenshotBase64}" alt="Screenshot" style="max-width: 900px; height: auto; border: 1px solid #ccc; margin: 10px 0;">`;
    }

    const stepData = {
        actualResult: htmlResult,
        statusName: status
    };

    // Check if key exists
    if (buffer[testCaseKey]) {
        buffer[testCaseKey].push(stepData);
    } else {
        buffer[testCaseKey] = [stepData];
    }
}

export async function updateTestResult() {
    if (process.env.UPDATE_TEST_RESULTS !== 'true') return;

    console.log('Updating test result in Zephyr...');

    for (let key in buffer) {
        const testCaseKey = key;
        const testCaseId = await getTestCycle(testCaseKey);
        const testExecutionKey = await getTestExecutionKey(testCaseId);
        await updateTestSteps(testExecutionKey, buffer[key]);
    }
}