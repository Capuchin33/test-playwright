import * as fs from 'fs';
import * as path from 'path'


// Допоміжна функція для читання результатів тестів
function readTestResults() {
    // Шлях до файлу з результатами тестів
    const testResultsPath = path.join(process.cwd(), 'test-results', 'test-results.json');
    
    // Перевіряємо, чи існує файл
    if (!fs.existsSync(testResultsPath)) {
        console.error('Test results file not found:', testResultsPath);
        return null;
    }
    
    // Читаємо та парсимо JSON файл
    const testResultsContent = fs.readFileSync(testResultsPath, 'utf-8');
    const testResults = JSON.parse(testResultsContent);
    
    return testResults;
}

export async function getResultsFromJson() {

    console.log('Getting results for Zephyr...');
    
    const testResults = readTestResults();
    
    if (!testResults) {
        console.error('No test results found');
        return null;
    }
    
    // Виключаємо testTitle з кожного тесту та stepTitle з кожного кроку
    const processedResults = {
        ...testResults,
        tests: testResults.tests.map(({ testTitle, ...test }) => ({
            ...test,
            steps: test.steps.map(({ stepTitle, ...step }) => step)
        }))
    };
    
    return processedResults;
}

