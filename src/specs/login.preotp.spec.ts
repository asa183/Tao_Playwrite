import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { setupBasicAuthRouting } from '../utils/basicAuth';

test('ログインフォーム表示→ログイン→OTP入力画面表示', async ({ page }) => {
  const baseUrl = process.env.TAO_BASE_URL;
  const email = process.env.TAO_ADMIN_EMAIL;
  const password = process.env.TAO_ADMIN_PASSWORD;

  if (!baseUrl || !email || !password) {
    throw new Error('環境変数 TAO_BASE_URL, TAO_ADMIN_EMAIL, TAO_ADMIN_PASSWORD を設定してください。');
  }

  await setupBasicAuthRouting(page, baseUrl);
  const loginPage = new LoginPage(page);

  // ログインURLへ自動フォールバックしてフォームを表示
  await loginPage.navigateToLogin(baseUrl);
  await loginPage.login(email, password);

  // OTP 送信ボタンがある場合は押下（ない場合はスキップ）
  await loginPage.sendOtpIfPrompted();

  // OTP 入力欄が表示されること（ここでテスト終了）
  await expect(loginPage.otpField).toBeVisible();

  // 診断用に最終URLを出力
  // eslint-disable-next-line no-console
  console.log('Final URL:', page.url());
});
