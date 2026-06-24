# Zest Playwright Configuration

Zest Playwright provides a configuration system similar to `playwright.config.ts` for customizing test reporting, screenshots, and Zephyr integration.

## Quick Start

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
    onlyOnFailure: true,
  },
  zephyr: {
    enabled: true,
    updateResults: true,
  }
});
```

## Configuration Options

### Reporter Settings

```typescript
reporter: {
  // Save test results to JSON file
  // @default true
  saveJsonReport?: boolean;

  // Output directory for JSON reports
  // @default 'test-results'
  outputDir?: string;

  // Print test results to console
  // @default false
  printToConsole?: boolean;

  // Print verbose output (includes all step details)
  // @default false
  verbose?: boolean;
}
```

### Screenshot Settings

```typescript
screenshots: {
  // Enable screenshot capture
  // @default true
  enabled?: boolean;

  // Include screenshots in JSON report
  // @default true
  includeInReport?: boolean;

  // Capture screenshots only on failure
  // @default false
  onlyOnFailure?: boolean;
}
```

### Zephyr Scale Integration

```typescript
zephyr: {
  // Enable Zephyr Scale integration
  // @default false
  enabled?: boolean;

  // Zephyr API URL
  apiUrl?: string;

  // Zephyr API key (recommended to use environment variable)
  apiKey?: string;

  // Test Cycle Key
  testCycleKey?: string;

  // Update test results in Zephyr after test run
  // @default false
  updateResults?: boolean;
}
```

## Examples

### Example 1: Minimal Configuration

```typescript
import { defineZestConfig } from './zest-pw/config';

export default defineZestConfig({
  reporter: {
    saveJsonReport: true,
  }
});
```

### Example 2: Development Mode

```typescript
import { defineZestConfig } from './zest-pw/config';

export default defineZestConfig({
  reporter: {
    saveJsonReport: true,
    printToConsole: true,
    verbose: true,
  },
  screenshots: {
    enabled: true,
    includeInReport: true,
  }
});
```

### Example 3: CI/CD with Zephyr

```typescript
import { defineZestConfig } from './zest-pw/config';

export default defineZestConfig({
  reporter: {
    saveJsonReport: true,
    outputDir: 'test-results',
  },
  screenshots: {
    enabled: true,
    onlyOnFailure: true,
  },
  zephyr: {
    enabled: true,
    updateResults: true,
    // Use environment variables for sensitive data
    apiUrl: process.env.ZEPHYR_API_URL,
    apiKey: process.env.ZEPHYR_API_KEY,
    testCycleKey: process.env.ZEPHYR_TEST_CYCLE_KEY,
  }
});
```

### Example 4: Different Configurations per Environment

```typescript
import { defineZestConfig } from './zest-pw/config';

const isDev = process.env.NODE_ENV === 'development';
const isCI = process.env.CI === 'true';

export default defineZestConfig({
  reporter: {
    saveJsonReport: true,
    printToConsole: isDev,
    verbose: isDev,
  },
  screenshots: {
    enabled: true,
    onlyOnFailure: isCI,
  },
  zephyr: {
    enabled: isCI,
    updateResults: isCI,
  }
});
```

## Environment Variables

You can still use environment variables for sensitive data:

```bash
# .env file
ZEPHYR_API_URL=https://api.zephyrscale.smartbear.com/v2/
ZEPHYR_API_KEY=your-api-key-here
ZEPHYR_TEST_CYCLE_KEY=TEST-CYCLE-123
```

Then reference them in your config:

```typescript
export default defineZestConfig({
  zephyr: {
    apiUrl: process.env.ZEPHYR_API_URL,
    apiKey: process.env.ZEPHYR_API_KEY,
    testCycleKey: process.env.ZEPHYR_TEST_CYCLE_KEY,
  }
});
```

## TypeScript Support

The configuration is fully typed, so you'll get autocomplete and type checking in your IDE:

```typescript
import { defineZestConfig, ZestConfig } from './zest-pw/config';

const config: ZestConfig = {
  reporter: {
    saveJsonReport: true, // ✅ Type-safe
    invalidOption: 'test', // ❌ TypeScript error
  }
};

export default defineZestConfig(config);
```

## Migration from Environment Variables

If you're currently using environment variables, here's how to migrate:

**Before (.env):**
```bash
SAVE_TEST_RESULTS_TO_JSON=true
PRINT_TEST_RESULTS=true
UPDATE_TEST_RESULTS=true
```

**After (zest.config.ts):**
```typescript
export default defineZestConfig({
  reporter: {
    saveJsonReport: true,
    printToConsole: true,
  },
  zephyr: {
    enabled: true,
    updateResults: true,
  }
});
```

## Default Configuration

If no `zest.config.ts` file is found, the following defaults are used:

```typescript
{
  reporter: {
    saveJsonReport: true,
    outputDir: 'test-results',
    printToConsole: false,
    verbose: false,
  },
  screenshots: {
    enabled: true,
    includeInReport: true,
    onlyOnFailure: false,
  },
  zephyr: {
    enabled: false,
    updateResults: false,
  }
}
```

