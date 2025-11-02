import * as fs from 'fs';

/**
 * Парсить заплановані кроки тесту з файлу
 * @param filePath - Шлях до файлу тесту
 * @param testTitle - Назва тесту
 * @returns Масив назв запланованих кроків
 */
export function parsePlannedStepsFromFile(filePath: string, testTitle: string): string[] {
  const steps: string[] = [];
  
  try {
    // Перевіряємо, чи файл існує
    if (!fs.existsSync(filePath)) {
      return steps;
    }

    const src = fs.readFileSync(filePath, 'utf8');
    const lines = src.split(/\r?\n/);
    
    let currentTestTitle: string | null = null;
    let insideTargetTest = false;
    let braceCount = 0;
    let testStartLine = -1;
    
    // Регулярні вирази для пошуку тестів та кроків
    const testTitleRegex = /\btest(\.only|\.skip|\.fixme)?\s*\(\s*(["'`])([^"'`]+)\2\s*,/;
    const stepRegex = /\b(?:test|await\s+test)\.step\s*\(\s*(["'`])([^"'`]+)\1\s*,/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Перевіряємо, чи це початок нового тесту
      const testMatch = line.match(testTitleRegex);
      if (testMatch) {
        const foundTitle = testMatch[3];
        
        // Якщо ми були всередині іншого тесту, скидаємо стан
        if (insideTargetTest && foundTitle !== testTitle) {
          insideTargetTest = false;
          braceCount = 0;
        }
        
        if (foundTitle === testTitle) {
          currentTestTitle = foundTitle;
          insideTargetTest = true;
          steps.length = 0;
          testStartLine = i;
          braceCount = 0;
          // Починаємо рахувати відкриваючі дужки
          const openBraces = (line.match(/\{/g) || []).length;
          const closeBraces = (line.match(/\}/g) || []).length;
          braceCount += openBraces - closeBraces;
          continue;
        } else {
          currentTestTitle = foundTitle;
          continue;
        }
      }
      
      // Якщо ми знаходимось всередині потрібного тесту, шукаємо кроки
      if (insideTargetTest && currentTestTitle === testTitle) {
        // Рахуємо дужки для визначення меж тесту
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        // Якщо дужки закрилися, тест закінчився
        if (braceCount <= 0 && i > testStartLine) {
          break;
        }
        
        const stepMatch = line.match(stepRegex);
        if (stepMatch) {
          steps.push(stepMatch[2]);
        }
      }
    }
  } catch (error) {
    // Мовчки ігноруємо помилки парсингу
    console.error(`Помилка парсингу файлу ${filePath}:`, error);
  }
  
  return steps;
}

