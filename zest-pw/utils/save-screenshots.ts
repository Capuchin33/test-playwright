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
 */
export function saveBase64Screenshot(
  base64String: string,
  filename: string,
  outputDir: string = 'screenshots'
): string {
  const screenshotsPath = path.join(process.cwd(), outputDir);
  if (!fs.existsSync(screenshotsPath)) {
    fs.mkdirSync(screenshotsPath, { recursive: true });
  }

  const filepath = path.join(screenshotsPath, filename);
  const buffer = decodeBase64ToBuffer(base64String);
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

