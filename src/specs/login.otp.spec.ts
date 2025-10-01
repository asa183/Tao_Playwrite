import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { promptOtp } from '../utils/otp';

test('ログイン→OTP入力→ダッシュボード到達', async ({ page }) => {
  const baseUrl = process.env.TAO_BASE_URL;
  const email = process.env.TAO_ADMIN_EMAIL;
  const password = process.env.TAO_ADMIN_PASSWORD;

  if (!baseUrl || !email || !password) {
    throw new Error('環境変数 TAO_BASE_URL, TAO_ADMIN_EMAIL, TAO_ADMIN_PASSWORD を設定してください。');
  }

  const loginPage = new LoginPage(page);

  // Basic Auth を全リクエストに付与（同一ホスト限定）。リダイレクト/静的アセットにも適用。
  const baUser = process.env.TAO_BASIC_AUTH_USER;
  const baPass = process.env.TAO_BASIC_AUTH_PASSWORD;
  if (baUser && baPass && baseUrl) {
    const host = new URL(baseUrl).host;
    const authorization = 'Basic ' + Buffer.from(`${baUser}:${baPass}`).toString('base64');
    await page.route('**/*', async (route) => {
      const req = route.request();
      try {
        const url = new URL(req.url());
        if (url.host === host) {
          const headers = { ...req.headers(), authorization };
          return route.continue({ headers });
        }
      } catch {}
      return route.continue();
    });
  }

  // ログインURLへ自動フォールバックしてフォームを表示
  await loginPage.navigateToLogin(baseUrl);
  await loginPage.login(email, password);

  // OTP 送信ボタンがある場合は押下（ない場合はスキップ）
  await loginPage.sendOtpIfPrompted();

  // OTP 入力欄が表示されるまで待機
  await expect(loginPage.otpField).toBeVisible();

  const otp = await promptOtp('メールに届いた6桁コードを入力してください: ');
  await loginPage.enterOtp(otp);

  await loginPage.submitOtp();

  // 目的ページへ（保護ルート）遷移して可視性確認 or ダッシュボード確認
  try {
    await loginPage.goto(baseUrl);
  } catch {
    // baseUrl が保護ルートでなければスキップ
  }
  await loginPage.expectDashboardVisible();
});
