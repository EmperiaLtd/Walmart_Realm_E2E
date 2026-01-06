import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000, 
  retries: 3,
  workers: 3,
  reporter: 
  [['list'],
   ['html'],
  ['json', { outputFile: 'playwright-report/report.json' }]
],
  // optional: HTML report
  use: {
    headless: true, // run in headless mode
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20 * 1000,
    navigationTimeout: 60 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /^(?!.*iPhone).*\.spec\.ts$/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /^(?!.*iPhone).*\.spec\.ts$/,
    },
    {
      name: 'iPhone',
      use: { ...devices['iPhone 13'] },
      testMatch: /.*iPhone\.spec\.ts$/,
    },
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
      testMatch: /^(?!.*iPhone).*\.spec\.ts$/,
    },
  ],
});
