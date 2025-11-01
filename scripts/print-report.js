/*
  Pretty printer for Playwright JSON report (playwright-report/report.json)
  Usage: node scripts/print-report.js [optional-path]
*/

import { readFileSync, existsSync } from 'fs';
import { join, isAbsolute, basename, resolve } from 'path';

// Simple ANSI color helpers (no external deps)
const ansi = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  gray: '\u001b[90m',
};

function color(text, c) {
  return `${c}${text}${ansi.reset}`;
}

function formatDuration(ms) {
  if (ms == null) return '-';
  const s = Math.floor(ms / 1000);
  const msRemain = ms % 1000;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (sec || (!h && !m)) parts.push(`${sec}.${String(msRemain).padStart(3, '0')}s`);
  return parts.join(' ');
}

function padRight(str, len) {
  const s = String(str);
  if (s.length >= len) return s;
  return s + ' '.repeat(len - s.length);
}

function printHeader(title) {
  const line = '─'.repeat(Math.max(20, title.length + 4));
  console.log(color(line, ansi.gray));
  console.log(color(`  ${title}  `, ansi.bold));
  console.log(color(line, ansi.gray));
}

function statusBadge(status) {
  switch (status) {
    case 'passed':
      return color('✅ passed', ansi.green);
    case 'failed':
      return color('❌ failed', ansi.red);
    case 'skipped':
      return color('↷ skipped', ansi.gray);
    case 'flaky':
      return color('⚠ flaky', ansi.yellow);
    case 'timedOut':
      return color('⏳ timeout', ansi.yellow);
    default:
      return color(status || 'unknown', ansi.blue);
  }
}

function stepStatusBadge(stepStatus) {
  switch (stepStatus) {
    case 'passed':
      return color('✓', ansi.green);
    case 'failed':
      return color('✗', ansi.red);
    case 'skipped':
      return color('↷', ansi.gray);
    case 'timedOut':
      return color('⏳', ansi.yellow);
    default:
      return color('•', ansi.gray);
  }
}

function safeReadJson(filePath) {
  try {
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(color(`Не вдалося прочитати або розпарсити файл: ${filePath}`, ansi.red));
    console.error(color(String(err), ansi.red));
    process.exitCode = 1;
    return null;
  }
}

// Cache for planned steps parsed from test files
const plannedStepsFileCache = new Map();

function getTestFileAbsolutePath(suite, report) {
  const suiteFile = suite.file || '';
  // Prefer report.config.rootDir if present, else first project's testDir, else ./tests
  const cfg = report && report.config ? report.config : {};
  const rootDir = cfg.rootDir || (cfg.projects && cfg.projects[0] && cfg.projects[0].testDir) || join(process.cwd(), 'tests');
  // Some reports have only the basename; join with rootDir
  return isAbsolute(suiteFile) ? suiteFile : join(rootDir, suiteFile);
}

function parsePlannedStepsByTestTitle(filePath) {
  if (plannedStepsFileCache.has(filePath)) return plannedStepsFileCache.get(filePath);
  const map = new Map(); // title -> [stepTitle]
  try {
    const src = readFileSync(filePath, 'utf8');
    const lines = src.split(/\r?\n/);
    let currentTestTitle = null;
    const testTitleRegex = /\btest\s*\(\s*(["'`])([^"'`]+)\1\s*,/;
    const stepRegex = /\btest\.step\s*\(\s*(["'`])([^"'`]+)\1\s*,/;
    for (const line of lines) {
      const tMatch = line.match(testTitleRegex);
      if (tMatch) {
        currentTestTitle = tMatch[2];
        if (!map.has(currentTestTitle)) map.set(currentTestTitle, []);
        continue;
      }
      const sMatch = line.match(stepRegex);
      if (sMatch && currentTestTitle) {
        map.get(currentTestTitle).push(sMatch[2]);
      }
    }
  } catch (_) {
    // Ignore parsing errors; fall back to executed steps only
  }
  plannedStepsFileCache.set(filePath, map);
  return map;
}

function printStats(stats) {
  if (!stats) return;
  const entries = [
    ['Очікуваних', stats.expected],
    ['Пропущених', stats.skipped],
    ['Неочікуваних', stats.unexpected],
    ['Flaky', stats.flaky],
  ];
  const leftPad = Math.max(...entries.map(([k]) => k.length));
  const start = stats.startTime ? new Date(stats.startTime).toLocaleString() : '-';
  console.log(`${color('Старт', ansi.cyan)}: ${start}`);
  console.log(`${color('Тривалість', ansi.cyan)}: ${formatDuration(Math.round((stats.duration || 0)))}`);
  for (const [k, v] of entries) {
    console.log(`${padRight(color(k, ansi.cyan), leftPad + 10)} ${v}`);
  }
}

function printTests(report) {
  if (!report.suites || !Array.isArray(report.suites)) return;
  for (const suite of report.suites) {
    const suiteTitle = suite.title || suite.file || 'Suite';
    console.log();
    console.log(color(`› ${suiteTitle}`, ansi.magenta));

    if (!suite.specs) continue;
    // Try to parse planned steps from source file
    const absFilePath = getTestFileAbsolutePath(suite, report);
    const plannedByTitle = parsePlannedStepsByTestTitle(absFilePath);
    for (const spec of suite.specs) {
      const specTitle = spec.title || 'Spec';
      // Each spec has tests (by project), each with results (retries)
      const tests = spec.tests || [];
      for (const test of tests) {
        const project = test.projectName || test.projectId || '';
        const expected = test.expectedStatus;
        const results = test.results || [];
        // Choose last attempt as final (or first if only one)
        const final = results.length ? results[results.length - 1] : {};
        const status = final.status || expected || 'unknown';
        const duration = final.duration != null ? final.duration : undefined;
        const badge = statusBadge(status);

        console.log(`  ${badge}  ${color(specTitle, ansi.bold)} ${project ? color(`[${project}]`, ansi.dim) : ''}  ${color(formatDuration(duration), ansi.dim)}`);

        // steps
        const steps = final.steps || [];
        const executedStepTitles = [];
        for (const step of steps) {
          const stepTitle = step.title || 'step';
          executedStepTitles.push(stepTitle);
          const stepDur = formatDuration(step.duration);
          // В JSON Playwright не завжди є явний статус кроку. Визначаємо так:
          // 1) якщо step.status присутній — використовуємо його
          // 2) якщо є step.error — вважаємо failed
          // 3) інакше наслідуємо фінальний статус тесту (passed => passed, інакше unknown)
          const explicitStatus = step.status || (step.error ? 'failed' : undefined);
          // Якщо немає явного статусу і немає помилки на кроці — вважаємо, що крок пройшов
          const inferredStatus = explicitStatus || 'passed';
          const badgeStep = stepStatusBadge(inferredStatus);
          const label = inferredStatus === 'passed'
            ? color('passed', ansi.green)
            : inferredStatus === 'failed'
              ? color('failed', ansi.red)
              : color(inferredStatus, ansi.gray);
          console.log(`      ${badgeStep} ${label}  ${stepTitle} ${color(stepDur, ansi.dim)}`);
        }

        // Append planned but not executed steps as placeholders (no status)
        const plannedList = plannedByTitle.get(specTitle) || [];
        if (plannedList.length > executedStepTitles.length) {
          const remaining = plannedList.slice(executedStepTitles.length);
          for (const remainingTitle of remaining) {
            console.log(`      ${color('•', ansi.gray)} ${color(remainingTitle, ansi.dim)}`);
          }
        }

        // stdout
        const out = final.stdout || [];
        if (out.length) {
          console.log(color('      ─ stdout ─', ansi.gray));
          for (const o of out) {
            const t = (o && o.text) ? o.text.replace(/\n$/, '') : String(o);
            if (t) console.log(`        ${color(t, ansi.gray)}`);
          }
        }

        // errors
        const errors = final.errors || [];
        for (const e of errors) {
          let message = e && (e.message || e.value || e.toString());
          if (message) {
            // Видаляємо ANSI escape коди з повідомлення
            message = message.replace(/\u001b\[[0-9;]*m/g, '');
            
            // Парсимо Expected і Received
            let expected = null;
            let received = null;
            
            // Шукаємо "Expected:" або "Expected"
            const expectedMatch = message.match(/Expected[:\s]+([^\n]+)/i);
            if (expectedMatch) {
              expected = expectedMatch[1].trim();
            }
            
            // Шукаємо "Received:"
            const receivedMatch = message.match(/Received[:\s]+([^\n]+)/i);
            if (receivedMatch) {
              received = receivedMatch[1].trim();
            }
            
            
            console.log(color('      ─ error ─', ansi.red));
            
            if (expected || received) {
              if (expected) {
                console.log(color(`      Expected: ${expected}`, ansi.red));
              }
              if (received) {
                console.log(color(`      Received: ${received}`, ansi.red));
              }
            } else {
              // Fallback: виводимо перший рядок
              const firstLine = message.split('\n')[0].trim();
              console.log(color(`      ${firstLine}`, ansi.red));
            }

          }
        }
      }
    }
  }
}

function main() {
  const defaultPath = join(process.cwd(), 'playwright-report', 'report.json');
  const filePath = process.argv[2] ? resolve(process.argv[2]) : defaultPath;

  if (!existsSync(filePath)) {
    console.error(color(`Файл не знайдено: ${filePath}`, ansi.red));
    console.error(color('Спочатку згенеруйте звіт: npx playwright test --reporter=json', ansi.yellow));
    process.exit(1);
  }

  const report = safeReadJson(filePath);
  if (!report) return;

  printHeader('Playwright Test Report');

  // Overall quick summary line
  // const stats = report.stats || {};
  // const total = (stats.expected || 0) + (stats.unexpected || 0) + (stats.skipped || 0) + (stats.flaky || 0);
  // const ok = stats.expected || 0;
  // const fail = stats.unexpected || 0;
  // const quick = `${color('Підсумок', ansi.cyan)}: ${color(`${ok} пройшло`, ansi.green)}, ${fail ? color(`${fail} впало`, ansi.red) : color('0 впало', ansi.green)}, ${stats.skipped || 0} пропущено, ${stats.flaky || 0} flaky`;
  // console.log(quick);
  // console.log();

  // Detailed stats
  // printStats(stats); // закоментовано на прохання — ховаємо детальний блок статистики

  // Tests breakdown
  printTests(report);

  console.log();
  console.log(color('Готово.', ansi.dim));
}

main();


