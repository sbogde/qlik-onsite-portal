import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], process.env.CI ? ['html'] : undefined].filter(Boolean) as any,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'VITE_QA_MOCK=true npm run dev -- --host 0.0.0.0 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    env: { VITE_QA_MOCK: 'true', ...process.env },
  },
});
