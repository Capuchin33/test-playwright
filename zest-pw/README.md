# Zest Playwright Test Framework

Advanced Playwright test framework with automatic screenshots, custom reporting, and Zephyr Scale integration.

## ✨ Features

- 📸 **Automatic Screenshots** - Capture screenshots after each test step
- 📊 **Custom JSON Reports** - Detailed test results with step information
- 🔄 **Zephyr Scale Integration** - Automatically update test results in Zephyr
- ⚙️ **Type-Safe Configuration** - Configure behavior via `zest.config.ts`
- 🎯 **Step-by-Step Tracking** - Detailed information about each test step
- 🖼️ **Base64 Screenshots in Reports** - Screenshots embedded directly in JSON

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Configuration

Create a `zest.config.ts` file in your project root:

```typescript
import { defineZestConfig } from './zest-pw/config';

export default defineZestConfig({
  reporter: {
    saveJsonReport: true,
    printToConsole: true,
  },
  screenshots: {
    enabled: true,
    includeInReport: true,
  },
});
```

### 3. Write Your First Test

```typescript
import { test, expect } from '../zest-pw/fixtures/fixtures'

test('TC-001: Check the title', async ({ page }) => {
  
  await test.step('Go to the playwright website', async () => {
    await page.goto('https://playwright.dev/');
  });

  await test.step('Check the title', async () => {
    await expect(page).toHaveTitle(/Playwright/);
  });
});
```

### 4. Run Tests

```bash
npm test
```

## ⚙️ Configuration

### Configuration File

Create `zest.config.ts` in your project root to customize framework behavior:

```typescript
import { defineZestConfig } from './zest-pw/config';

export default defineZestConfig({
  reporter: {
    // Save test results to JSON file
    saveJsonReport: true,
    
    // Output directory for reports
    outputDir: 'test-results',
    
    // Print test results to console
    printToConsole: false,
  },

  screenshots: {
    // Enable screenshot capture
    enabled: true,
    
    // Include screenshots in JSON report
    includeInReport: true,
    
    // Capture screenshots only on failure
    onlyOnFailure: false,
  },

  zephyr: {
    // Enable Zephyr Scale integration
    enabled: false,
    
    // Update test results in Zephyr after test run
    updateResults: false,
  },
});
```

For detailed configuration options, see [CONFIG.md](./CONFIG.md).

## 📸 Screenshots

Screenshots are automatically captured after each `test.step()` and:
- **Embedded in JSON report** as base64 (if `includeInReport: true`)
- **Named descriptively** based on step title and index
- **Include error screenshots** when tests fail

### Screenshot Settings

```typescript
screenshots: {
  enabled: true,           // Enable/disable screenshots
  includeInReport: true,   // Include in JSON report
  onlyOnFailure: false,    // Capture only on test failure
}
```

### Example Screenshot Output

```json
{
  "fileName": "step_1_go_to_the_playwright_website.png",
  "image": "image/png",
  "body": "base64_encoded_screenshot..."
}
```

## 📊 Test Reports

### JSON Report

Test results are automatically saved to `test-results/test-results.json`:

```json
{
  "tests": [
    {
      "testTitle": "Check the title",
      "testCaseKey": "TC-001",
      "steps": [
        {
          "stepTitle": "Go to the playwright website",
          "actualResult": [...],
          "statusName": "passed"
        }
      ]
    }
  ]
}
```

### Console Output

Enable console output in your config:

```typescript
reporter: {
  printToConsole: true,
}
```

## 🔄 Zephyr Scale Integration

### Setup

1. Add environment variables:

```bash
# .env
ZEPHYR_API_URL=https://api.zephyrscale.smartbear.com/v2/
ZEPHYR_API_KEY=your-api-key
ZEPHYR_TEST_CYCLE_KEY=TEST-CYCLE-123
```

2. Enable in configuration:

```typescript
zephyr: {
  enabled: true,
  updateResults: true,
}
```

3. Run tests - results will be automatically sent to Zephyr!

### How it Works

- Test case keys are extracted from test file names (e.g., `TC-001.spec.ts` → `TC-001`)
- After test execution, results are sent to Zephyr Scale
- Test steps are updated with actual results and screenshots

## 🛠️ Project Structure

```
test-playwright/
├── tests/                  # Test files
│   ├── TC-001.spec.ts
│   └── TC-002.spec.ts
├── zest-pw/               # Zest Framework
│   ├── config.ts          # Configuration system
│   ├── index.ts           # Main exports
│   ├── fixtures/          # Custom fixtures with auto-screenshots
│   │   └── fixtures.ts
│   ├── reporter/          # Custom reporter
│   │   ├── custom-reporter.ts
│   │   ├── result-processor.ts
│   │   └── test-results-store.ts
│   ├── utils/             # Utilities
│   │   ├── test-result-transformer.ts
│   │   ├── enrich-test-results.ts
│   │   ├── add-file-names.ts
│   │   ├── save-json-report.ts
│   │   └── terminal-reporter.ts
│   └── zephyr-api/        # Zephyr integration
│       ├── zephyr-api.ts
│       ├── get-results-from-json.ts
│       └── update-execution-result.ts
├── test-results/          # Test results
│   └── test-results.json
├── zest.config.ts         # Zest configuration
└── playwright.config.ts   # Playwright configuration
```

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../zest-pw/fixtures/fixtures'

test('TC-001: Test description', async ({ page }) => {
  
  await test.step('Step 1 description', async () => {
    // Your test code
  });

  await test.step('Step 2 description', async () => {
    // Your test code
  });
});
```

### Test Naming Convention

Name your test files with test case keys for Zephyr integration:

```
tests/
├── TC-001.spec.ts   ✅ Good - extracts "TC-001"
├── TC-002.spec.ts   ✅ Good - extracts "TC-002"
└── login.spec.ts    ⚠️  Will not sync with Zephyr
```

### Best Practices

1. **Use descriptive step names** - they become screenshot filenames
2. **One test per file** - easier to manage and sync with Zephyr
3. **Keep steps atomic** - each step should be a single action or assertion
4. **Use test case keys** - for Zephyr integration

## 💡 Commands

```bash
# Run all tests
npm test

# Run specific test
npm test -- tests/TC-001.spec.ts

# Run in headed mode
npm test -- --headed

# Run in debug mode
npm test -- --debug

# Run with UI
npm test -- --ui

# Generate Playwright report
npx playwright show-report
```

## 🔧 Advanced Usage

### Custom Configuration per Environment

```typescript
const isDev = process.env.NODE_ENV === 'development';
const isCI = process.env.CI === 'true';

export default defineZestConfig({
  reporter: {
    printToConsole: isDev,
  },
  screenshots: {
    onlyOnFailure: isCI,
  },
  zephyr: {
    enabled: isCI,
    updateResults: isCI,
  }
});
```

### Accessing Configuration in Code

```typescript
import { getZestConfig } from './zest-pw/config';

const config = getZestConfig();
console.log('Screenshots enabled:', config.screenshots.enabled);
```

### Programmatic Configuration

```typescript
import { defineZestConfig } from './zest-pw/config';

export default defineZestConfig({
  reporter: {
    saveJsonReport: process.env.SAVE_REPORTS !== 'false',
    outputDir: process.env.REPORT_DIR || 'test-results',
  }
});
```

## 🐛 Troubleshooting

### Screenshots not appearing in report

Check your configuration:
```typescript
screenshots: {
  enabled: true,
  includeInReport: true,
}
```

### Zephyr integration not working

1. Verify environment variables are set
2. Check test case keys match Zephyr format
3. Enable Zephyr in configuration
4. Check API credentials and permissions

### JSON report not saved

Ensure configuration allows saving:
```typescript
reporter: {
  saveJsonReport: true,
}
```

## 📚 Documentation

- [Configuration Guide](./CONFIG.md) - Detailed configuration options
- [Playwright Documentation](https://playwright.dev/) - Official Playwright docs
- [Zephyr Scale API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) - Zephyr API reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
