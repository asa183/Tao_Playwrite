import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.TAO_BASE_URL ?? 'http://localhost:3000';
const headed = /^(1|true|yes)$/i.test(process.env.TAO_DEBUG || '');
const slowMo = process.env.TAO_SLOWMO ? Number(process.env.TAO_SLOWMO) : undefined;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ja-JP',
    httpCredentials: (process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASS)
      ? { username: process.env.BASIC_AUTH_USER as string, password: process.env.BASIC_AUTH_PASS as string }
      : undefined,
    headless: headed ? false : undefined,
    launchOptions: slowMo ? { slowMo } : undefined
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
