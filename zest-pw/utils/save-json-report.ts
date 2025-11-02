import * as fs from 'fs';
import * as path from 'path';

/**
 * Зберігає результати тестів у JSON файл
 * @param result - Об'єкт з результатами тестів
 * @param outputDir - Директорія для збереження (за замовчуванням 'test-results')
 */
export function saveTestResultsToJson(result: any, outputDir: string = 'test-results'): string {
  try {
    // Створюємо директорію, якщо не існує
    const resultsPath = path.join(process.cwd(), outputDir);
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    // Формуємо назву файлу
    const filename = `test-results.json`;
    const filepath = path.join(resultsPath, filename);

    // Зберігаємо JSON з форматуванням
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');

    console.log(`\n📄 JSON звіт збережено: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error(`\n⚠️  Помилка при збереженні JSON звіту: ${error}`);
    throw error;
  }
}

