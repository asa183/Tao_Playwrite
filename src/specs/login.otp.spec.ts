import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { promptOtp } from '../utils/otp';
import { setupBasicAuthRouting } from '../utils/basicAuth';

test('ログイン→OTP入力→ダッシュボード到達', async ({ page }) => {
  const baseUrl = process.env.TAO_BASE_URL;
  const email = process.env.TAO_ADMIN_EMAIL;
  const password = process.env.TAO_ADMIN_PASSWORD;
  const loginOnly = /^(1|true|yes)$/i.test(process.env.TAO_LOGIN_ONLY || '');
  const manualOtp = /^(1|true|yes)$/i.test(process.env.TAO_OTP_MANUAL || '');

  if (!baseUrl || !email || !password) {
    throw new Error('環境変数 TAO_BASE_URL, TAO_ADMIN_EMAIL, TAO_ADMIN_PASSWORD を設定してください。');
  }

  const loginPage = new LoginPage(page);

  await setupBasicAuthRouting(page, baseUrl);

  // ログインURLへ自動フォールバックしてフォームを表示
  await loginPage.navigateToLogin(baseUrl);
  await loginPage.login(email, password);

  // OTP 送信ボタンがある場合は押下（ない場合はスキップ）
  await loginPage.sendOtpIfPrompted();

  // OTP 入力欄が表示されるまで待機
  await expect(loginPage.otpField).toBeVisible();

  // ログインのみ検証モード: ここで終了
  if (loginOnly) {
    return;
  }

  if (manualOtp) {
    // ブラウザ上でユーザーが直接OTPを入力し、認証ボタンを押すのを待つ
    // eslint-disable-next-line no-console
    console.log('Manual OTP mode: ブラウザで6桁コードを入力し、認証ボタンを押してください。');
    await loginPage.expectDashboardVisible();
    return;
  } else {
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
  }
});
