import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    // 直接ログインURLへ（ベースURLにホストが入る想定）
    await this.page.goto('/ja/university/sign_in', { waitUntil: 'domcontentloaded' });
  }

  async login(email: string, password: string) {
    // ラベルまたはプレースホルダーで検出（表記揺れ対応）
    const emailInput = this.page.getByLabel(/メールアドレス|Email/i)
      .or(this.page.getByPlaceholder(/メール|email/i))
      .or(this.page.locator('input[type="email"]'));
    const passInput  = this.page.getByLabel(/パスワード|Password/i)
      .or(this.page.getByPlaceholder(/パスワード|password/i))
      .or(this.page.locator('input[type="password"]'));
    const submitBtn  = this.page.getByRole('button', { name: /ログイン|Sign in|サインイン/i })
      .or(this.page.locator('button[type="submit"], input[type="submit"]'));

    await expect(emailInput).toBeVisible();
    await emailInput.fill(email);
    await passInput.fill(password);
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
    } else {
      await passInput.press('Enter');
    }
  }

  async expectSignedIn() {
    // 共通ナビゲーションが表示されること
    await expect(this.page.getByRole('navigation')).toBeVisible();

    // 管理メニューの代表例（文言に揺れがある前提で広めにマッチ）
    const adminMenu = this.page.getByRole('link', { name: /大学管理|University Admin|大学|管理/i });
    await expect(adminMenu).toBeVisible();
  }
}
