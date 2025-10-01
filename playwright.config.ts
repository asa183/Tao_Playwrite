import { defineConfig, devices } from '@playwright/test';

const baUser = process.env.TAO_BASIC_AUTH_USER;
const baPass = process.env.TAO_BASIC_AUTH_PASSWORD;
const basicAuthHeader = baUser && baPass
  ? 'Basic ' + Buffer.from(`${baUser}:${baPass}`).toString('base64')
  : undefined;

export default defineConfig({
  testDir: 'src/specs',
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.TAO_BASE_URL,
    httpCredentials: process.env.TAO_BASIC_AUTH_USER && process.env.TAO_BASIC_AUTH_PASSWORD
      ? { username: process.env.TAO_BASIC_AUTH_USER, password: process.env.TAO_BASIC_AUTH_PASSWORD }
      : undefined,
    extraHTTPHeaders: basicAuthHeader
      ? { Authorization: basicAuthHeader }
      : undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
