import { test } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';

test.describe('大学管理者ログイン', () => {
  test('ログイン成功で管理画面ナビが見える', async ({ page }, testInfo) => {
    const email = process.env.TAO_ADMIN_EMAIL!;
    const password = process.env.TAO_ADMIN_PASSWORD!;

    const login = new LoginPage(page);
    await login.goto();
    await login.login(email, password);
    await login.expectSignedIn();

    // スクリーンショットを保存・レポートに添付
    const shot = await page.screenshot({ path: 'screenshots/logged-in.png', fullPage: true });
    await testInfo.attach('logged-in', { body: shot, contentType: 'image/png' });
  });
});
