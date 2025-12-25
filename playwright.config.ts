import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * This configuration sets up end-to-end testing for the Trustless Voting System.
 * Tests simulate real user interactions across the admin and voter portals.
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Test file pattern
  testMatch: '**/*.spec.ts',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',

    // Viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for different browsers and apps
  projects: [
    // Voter Portal Tests
    {
      name: 'voter-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
      testDir: './e2e/voter',
    },

    // Admin Portal Tests
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
      testDir: './e2e/admin',
    },

    // Mobile Voter Tests
    {
      name: 'voter-mobile',
      use: {
        ...devices['iPhone 13'],
        baseURL: 'http://localhost:3001',
      },
      testDir: './e2e/voter',
    },

    // Full Election Flow (cross-app)
    {
      name: 'election-flow',
      use: {
        ...devices['Desktop Chrome'],
      },
      testDir: './e2e/flows',
    },
  ],

  // Run local dev servers before starting tests
  webServer: [
    {
      command: 'pnpm --filter admin dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'pnpm --filter voter dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
