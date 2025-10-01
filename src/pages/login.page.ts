import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get otpField(): Locator {
    // 代表的な OTP 入力欄候補をまとめたロケーター（OR で結合）
    // - ラベル/プレースホルダー表記揺れに対応
    // - name/id に otp/two_factor/code を含むケースをカバー
    const css = [
      'input[autocomplete="one-time-code"]',
      'input[name*="otp" i]',
      'input[id*="otp" i]',
      'input[name*="two_factor" i]',
      'input[id*="two_factor" i]',
      'input[name*="code" i]',
      'input[id*="code" i]'
    ].join(', ');
    const byPlaceholder = this.page.getByPlaceholder(/6桁|コード|認証コード|確認コード|otp|one[- ]?time/i);
    const byLabel = this.page.getByLabel(/6桁コード|認証コード|確認コード|ワンタイム|one[- ]?time|otp/i);
    return this.page.locator(`${css}`).or(byPlaceholder).or(byLabel);
  }

  async goto(url: string): Promise<void> {
    const u = new URL(url);
    const baUser = process.env.TAO_BASIC_AUTH_USER;
    const baPass = process.env.TAO_BASIC_AUTH_PASSWORD;
    if (baUser && baPass) {
      u.username = baUser;
      u.password = baPass;
    }
    const res = await this.page.goto(u.toString(), { waitUntil: 'domcontentloaded' });
    await this.failFastBasicAuth(res ?? undefined);
    try {
      if (res && 'status' in res && (res as any).status() === 404) {
        throw new Error(`ページが見つかりませんでした: ${u.toString()}`);
      }
    } catch {}
  }

  private originFrom(url: string): string {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  }

  async navigateToLogin(baseUrl: string): Promise<void> {
    const origin = this.originFrom(baseUrl);
    const baUser = process.env.TAO_BASIC_AUTH_USER;
    const baPass = process.env.TAO_BASIC_AUTH_PASSWORD;
    const withBA = (path: string) => {
      const u = new URL(path, origin);
      if (baUser && baPass) {
        u.username = baUser;
        u.password = baPass;
      }
      return u.toString();
    };
    const p = new URL(baseUrl).pathname;
    const candidates = [
      /\/login|\/sign_in/.test(p) ? baseUrl : '',
      '/ja/admin/sign_in',
      '/admin/sign_in',
      '/ja/admin/login',
      '/admin/login',
      '/ja/login',
      '/login',
      '/',
    ].filter(Boolean).map(withBA);

    let lastErr: unknown;
    for (const url of candidates) {
      try {
        const res = await this.page.goto(url, { waitUntil: 'domcontentloaded' });
        await this.failFastBasicAuth(res ?? undefined);
        // 404 は即次候補へ
        try {
          if (res && 'status' in res && (res as any).status() === 404) {
            continue;
          }
        } catch {}
        // SPA の 404 テンプレを軽量検知
        if (await this.isLikelyNotFound().catch(() => false)) {
          continue;
        }
        await this.firstVisible([
          this.page.getByRole('textbox', { name: /メール|email/i }),
          this.page.getByLabel(/メール|email/i),
          this.page.locator('input[type="email"]'),
        ], 5000);
        return; // found login form
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error(`ログインフォームが見つかりません。最後のエラー: ${lastErr}`);
  }

  private async isLikelyNotFound(): Promise<boolean> {
    const candidates: Locator[] = [
      this.page.getByText(/404/i),
      this.page.getByText(/not\s*found/i),
      this.page.getByText(/ページが見つかりません/i),
    ];
    for (const c of candidates) {
      if (await c.isVisible({ timeout: 300 }).catch(() => false)) return true;
    }
    return false;
  }

  private async failFastBasicAuth(res?: import('@playwright/test').APIResponse | import('@playwright/test').Response): Promise<void> {
    try {
      const status = (res && 'status' in res) ? (res as any).status() : undefined;
      if (status === 401) {
        throw new Error('Basic認証に失敗しました（HTTP 401）。TAO_BASIC_AUTH_USER / TAO_BASIC_AUTH_PASSWORD を確認してください。');
      }
    } catch {}
    // 画面文言でも検知（白画面のBasicエラーなど）
    const basicError = this.page.getByText(/HTTP\s+Basic:.*Access denied/i);
    if (await basicError.isVisible({ timeout: 1000 }).catch(() => false)) {
      throw new Error('Basic認証に失敗しました（画面に Access denied）。認証情報を確認してください。');
    }
  }

  private async firstVisible(locators: Locator[], timeout = 8000): Promise<Locator> {
    for (const loc of locators) {
      try {
        await loc.waitFor({ state: 'visible', timeout });
        return loc;
      } catch (_) {
        // try next
      }
    }
    throw new Error('要素が見つかりませんでした');
  }

  async ensureOnLoginForm(): Promise<void> {
    try {
      await this.firstVisible([
        this.page.getByRole('textbox', { name: /メール|email/i }),
        this.page.getByLabel(/メール|email/i),
        this.page.locator('input[type="email"]'),
      ], 5000);
      return;
    } catch {
      // フォールバック：同一ホストの既定ログインパスへ再遷移
      try {
        const current = new URL(this.page.url());
        const loginUrl = new URL('/ja/admin/login', `${current.protocol}//${current.host}`);
        await this.page.goto(loginUrl.toString());
        await this.firstVisible([
          this.page.getByRole('textbox', { name: /メール|email/i }),
          this.page.getByLabel(/メール|email/i),
          this.page.locator('input[type="email"]'),
        ], 10000);
        return;
      } catch (e) {
        throw new Error('ログインフォームが見つかりません。Basic認証が必要な場合は TAO_BASIC_AUTH_USER / TAO_BASIC_AUTH_PASSWORD を設定してください。');
      }
    }
  }

  async login(email: string, password: string): Promise<void> {
    const emailField = await this.firstVisible([
      this.page.getByPlaceholder(/メール|email/i),
      this.page.getByRole('textbox', { name: /メール|email/i }),
      this.page.getByLabel(/メール|email/i),
      this.page.locator('input[type="email"]'),
      this.page.locator('input[name*="email" i]'),
    ], 10000);

    const passwordField = await this.firstVisible([
      this.page.getByPlaceholder(/パスワード|password/i),
      this.page.getByLabel(/パスワード|password/i),
      this.page.getByRole('textbox', { name: /パスワード|password/i }),
      this.page.locator('input[type="password"]'),
      this.page.locator('input[name*="password" i]'),
    ], 10000);

    await emailField.fill(email);
    await passwordField.fill(password);

    // 送信手段: ボタンが取れればクリック、無ければ Enter 提交
    const buttonCandidates: Locator[] = [
      this.page.getByRole('button', { name: /ログイン|サインイン|sign in|log ?in/i }),
      this.page.getByRole('button', { name: /送信/ }),
      this.page.locator('button[type="submit"]'),
      this.page.locator('input[type="submit"]'),
    ];
    let clicked = false;
    for (const btn of buttonCandidates) {
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      await passwordField.press('Enter');
    }
  }

  async sendOtpIfPrompted(): Promise<void> {
    const sendBtnCandidates = [
      this.page.getByRole('button', { name: /コード送信|認証コード.*送信|コードを送信/i }),
      this.page.getByRole('button', { name: /送信/ }),
    ];
    for (const loc of sendBtnCandidates) {
      if (await loc.isVisible().catch(() => false)) {
        await loc.click();
        break;
      }
    }
  }

  async enterOtp(code: string): Promise<void> {
    const otpField = await this.firstVisible([
      this.page.getByLabel(/6桁コード|認証コード|確認コード|ワンタイム|one[- ]?time|otp/i),
      this.page.getByRole('textbox', { name: /6桁|コード|otp/i }),
      this.page.locator('input[autocomplete="one-time-code"]'),
      this.page.locator('input[name*="otp" i], input[id*="otp" i]'),
    ]);
    await otpField.fill(code);
  }

  async submitOtp(): Promise<void> {
    const submit = await this.firstVisible([
      this.page.getByRole('button', { name: /送信|認証|ログイン|続行|確認/i }),
    ]);
    await submit.click();
  }

  async expectDashboardVisible(): Promise<void> {
    const target = await this.firstVisible([
      this.page.getByRole('heading', { name: /ダッシュボード|dashboard|大学|universit/i }),
      this.page.locator('h1, h2').filter({ hasText: /ダッシュボード|大学|Dashboard/i }),
    ], 10000);
    await target.waitFor({ state: 'visible', timeout: 10000 });
  }
}
