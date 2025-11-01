import * as fs from 'fs';
import * as path from 'path';

/**
 * Декодує base64 рядок в Buffer
 */
function decodeBase64ToBuffer(base64String: string): Buffer {
  return Buffer.from(base64String, 'base64');
}

/**
 * Зберігає скріншот з base64 рядка
 * @param base64String - Base64 рядок скріншоту
 * @param filename - Назва файлу
 * @param outputDir - Базова директорія (за замовчуванням 'screenshots')
 * @param testTitle - Назва тесту (опціонально, створює підпапку для організації)
 */
export function saveBase64Screenshot(
  base64String: string,
  filename: string,
  outputDir: string = 'screenshots',
  testTitle?: string
): string {
  let screenshotsPath = path.join(process.cwd(), outputDir);
  
  // Якщо вказано назву тесту, створюємо окрему підпапку
  if (testTitle) {
    const safeTestTitle = testTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    screenshotsPath = path.join(screenshotsPath, safeTestTitle);
  }
  
  if (!fs.existsSync(screenshotsPath)) {
    fs.mkdirSync(screenshotsPath, { recursive: true });
  }

  const filepath = path.join(screenshotsPath, filename);
  const buffer = decodeBase64ToBuffer(base64String);
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

