/**
 * Zest Playwright Configuration
 * 
 * This file contains configuration options for the Zest Playwright test framework.
 * You can customize test reporting, screenshot behavior, and Zephyr integration.
 */

export interface ZestConfig {
  /**
   * Reporter settings
   */
  reporter?: {
    /**
     * Save test results to JSON file
     * @default true
     */
    saveJsonReport?: boolean;

    /**
     * Output directory for JSON reports
     * @default 'test-results'
     */
    outputDir?: string;

    /**
     * Print test results to console
     * @default false
     */
    printToConsole?: boolean;

    /**
     * Print verbose output (includes all step details)
     * @default false
     * @todo Not yet implemented - reserved for future use
     */
    verbose?: boolean;
  };

  /**
   * Screenshot settings
   */
  screenshots?: {
    /**
     * Enable screenshot capture
     * @default true
     */
    enabled?: boolean;

    /**
     * Include screenshots in JSON report
     * @default true
     */
    includeInReport?: boolean;

    /**
     * Capture screenshots only on failure
     * @default false
     */
    onlyOnFailure?: boolean;
  };

  /**
   * Zephyr Scale integration settings
   */
  zephyr?: {
    /**
     * Enable Zephyr Scale integration
     * @default false
     */
    enabled?: boolean;

    /**
     * Zephyr API URL
     */
    apiUrl?: string;

    /**
     * Zephyr API key (recommended to use environment variable)
     */
    apiKey?: string;

    /**
     * Test Cycle Key
     */
    testCycleKey?: string;

    /**
     * Update test results in Zephyr after test run
     * @default false
     */
    updateResults?: boolean;
  };
}

/**
 * Default Zest configuration
 */
export const defaultConfig: Required<ZestConfig> = {
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
    apiUrl: process.env.ZEPHYR_API_URL || '',
    apiKey: process.env.ZEPHYR_API_KEY || '',
    testCycleKey: process.env.ZEPHYR_TEST_CYCLE_KEY || '',
    updateResults: false,
  },
};

/**
 * Loaded configuration (merged with defaults)
 */
let loadedConfig: Required<ZestConfig> = { ...defaultConfig };

/**
 * Define Zest configuration
 * 
 * @param config - User configuration object
 * @returns Merged configuration
 * 
 * @example
 * ```typescript
 * export default defineZestConfig({
 *   reporter: {
 *     saveJsonReport: true,
 *     printToConsole: true,
 *   },
 *   screenshots: {
 *     enabled: true,
 *     onlyOnFailure: true,
 *   },
 *   zephyr: {
 *     enabled: true,
 *     updateResults: true,
 *   }
 * });
 * ```
 */
export function defineZestConfig(config: ZestConfig): Required<ZestConfig> {
  loadedConfig = {
    reporter: {
      ...defaultConfig.reporter,
      ...config.reporter,
    },
    screenshots: {
      ...defaultConfig.screenshots,
      ...config.screenshots,
    },
    zephyr: {
      ...defaultConfig.zephyr,
      ...config.zephyr,
    },
  };
  
  return loadedConfig;
}

/**
 * Get current Zest configuration
 * 
 * @returns Current configuration
 */
export function getZestConfig(): Required<ZestConfig> {
  return loadedConfig;
}

/**
 * Load Zest configuration from file
 * Looks for zest.config.ts in the root directory
 */
export async function loadZestConfig(): Promise<Required<ZestConfig>> {
  try {
    const configPath = process.cwd() + '/zest.config.ts';
    const userConfig = await import(configPath);
    
    if (userConfig.default) {
      return userConfig.default;
    }
    
    return loadedConfig;
  } catch (error) {
    // Config file not found or error loading - use defaults
    return loadedConfig;
  }
}

