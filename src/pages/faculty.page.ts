import { Page, expect } from '@playwright/test';

export class FacultyPage {
  constructor(private page: Page) {}

  async createIfNotExists(name: string) {
    const existingRow = this.page.getByRole('row', { name: new RegExp(name) });
    if (await existingRow.count() > 0 || await this.page.getByText(new RegExp(name)).first().isVisible().catch(() => false)) {
      return;
    }

    const add = this.page
      .locator('a.no-barba[href$="/university/university_departments/new"]')
      .or(this.page.locator('a[href*="/university_departments/new"]'))
      .or(this.page.locator('a:has(i.fa-plus)'))
      .or(this.page.locator('a.btn:has(i[class*="fa-plus"])'))
      .or(this.page.getByRole('button', { name: /学部.?\/?.?研究科.*作成|学部.*作成|研究科.*作成|新規作成|新規|追加|登録|Create|＋/i }))
      .or(this.page.getByRole('link', { name: /学部.?\/?.?研究科.*作成|学部.*作成|研究科.*作成|新規作成|新規|追加|Create|＋/i }))
      .or(this.page.locator('button, a', { hasText: /学部|研究科|新規|追加|Create|＋/i }));
    const addBtn = add.first();
    await addBtn.scrollIntoViewIfNeeded();
    const targetUrl = new URL('/ja/university/university_departments/new', new URL(this.page.url()).origin).toString();
    try {
      await Promise.all([
        this.page.waitForURL(/\/university_departments\/new/, { timeout: 5000 }),
        addBtn.click({ timeout: 3000 })
      ]);
    } catch {
      await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    }

    // 言語: 日本語を既定選択（必要な場合）
    const jp = this.page.getByLabel(/日本語/i).or(this.page.getByRole('radio', { name: /日本語/i }));
    if (await jp.count()) {
      const checked = await jp.first().isChecked().catch(() => false);
      if (!checked) await jp.first().click();
    }

    const nameInput =
      this.page.getByLabel(/学部名|研究科名|名称|Name/i).first()
        .or(this.page.getByPlaceholder(/学部|研究科|名称|Name/i).first())
        .or(this.page.getByRole('textbox', { name: /学部|研究科|名称|Name/i }).first());

    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);

    const save = this.page.getByRole('button', { name: /保存|登録|Save|作成/i })
      .or(this.page.getByRole('link', { name: /保存|登録|Save|作成/i }))
      .or(this.page.locator('button, a', { hasText: /保存|登録|Save|作成/i }));
    await save.first().click();

    await expect(this.page.getByRole('row', { name: new RegExp(name) })).toBeVisible({ timeout: 10000 });
  }
}
