import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // folder where your tests are located
  timeout: 30 * 1000, // 30 seconds per test
  // retries: 3, // set retries if needed
  workers: 1, // run tests with x workers
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
    navigationTimeout: 30 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // {
    //   name: 'iPhone',
    //   use: { ...devices['iPhone 13'] },
    // },
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],
});
