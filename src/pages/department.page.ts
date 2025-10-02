import { Page, expect } from '@playwright/test';

export class DepartmentPage {
  constructor(private page: Page) {}

  async createIfNotExists(name: string, facultyName: string) {
    const existingRow = this.page.getByRole('row', { name: new RegExp(`${facultyName}.*${name}|${name}.*${facultyName}`) });
    if (await existingRow.count() > 0 || await this.page.getByText(new RegExp(`${facultyName}.*${name}|${name}.*${facultyName}`)).first().isVisible().catch(() => false)) {
      return;
    }

    // 追加ボタンはアイコンのみ（テキストなし）の <a> である可能性が高い。
    // 役割/名前で見つからない場合に href やアイコンでフォールバック検出する。
    const add = this.page
      .locator('a[data-title="追加する"][href$="/university/university_subjects/new"]')
      .or(this.page.locator('a[data-title*="追加"]'))
      .or(this.page.locator('a.no-barba[href$="/university/university_subjects/new"]'))
      .or(this.page.locator('a[href*="/university_subjects/new"]'))
      .or(this.page.locator('a:has(i.fa-plus)'))
      .or(this.page.locator('a.btn:has(i[class*="fa-plus"])'))
      .or(this.page.getByRole('button', { name: /学科.?\/?.?専攻.*作成|学科.*作成|専攻.*作成|新規作成|新規|追加|登録|Create|＋/i }))
      .or(this.page.getByRole('link', { name: /学科.?\/?.?専攻.*作成|学科.*作成|専攻.*作成|新規作成|新規|追加|Create|＋/i }))
      .or(this.page.locator('button, a', { hasText: /学科|専攻|新規|追加|Create|＋/i }));
    const addBtn = add.first();
    await addBtn.scrollIntoViewIfNeeded();
    const targetUrl = new URL('/ja/university/university_subjects/new', new URL(this.page.url()).origin).toString();
    try {
      await Promise.all([
        this.page.waitForURL(/\/university_subjects\/new$/, { timeout: 5000 }),
        addBtn.click({ timeout: 1000 })
      ]);
    } catch {
      // クリックで遷移しない場合は直接遷移（BarbaやJS阻害のフォールバック）
      await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    }

    // 言語: 日本語を既定選択（必要な場合）
    const jp = this.page.getByLabel(/日本語/i).or(this.page.getByRole('radio', { name: /日本語/i }));
    if (await jp.count()) {
      const checked = await jp.first().isChecked().catch(() => false);
      if (!checked) await jp.first().click();
    }

    const facultySelector =
      this.page.getByRole('combobox', { name: /所属学部|親学部|学部|Faculty/i }).first()
        .or(this.page.locator('select').filter({ has: this.page.getByText(/所属学部|親学部|学部|Faculty/i) }).first())
        .or(this.page.getByLabel(/所属学部|親学部|学部|Faculty/i).first())
        .or(this.page.getByPlaceholder(/所属学部|親学部|学部|Faculty/i).first());

    await expect(facultySelector).toBeVisible();

    const tagName = (await facultySelector.evaluate(el => (el as HTMLElement).tagName)).toUpperCase();
    const cls = (await facultySelector.getAttribute('class')) || '';
    const isSelect2 = cls.includes('select2-hidden-accessible');
    if (tagName === 'SELECT' && !isSelect2) {
      await facultySelector.selectOption({ label: facultyName });
    } else if (isSelect2) {
      // Select2: セレクトは非表示。隣接する .select2-selection を開き、検索→候補選択。
      const opener = facultySelector.locator('xpath=following-sibling::span[contains(@class,"select2")]//span[contains(@class,"select2-selection")]').first();
      await opener.click();
      const dropdown = this.page.locator('.select2-container .select2-dropdown, .select2-container--open');
      await expect(dropdown).toBeVisible({ timeout: 3000 }).catch(() => {});
      const search = this.page.locator('input.select2-search__field');
      if (await search.count()) {
        await search.fill(facultyName);
      }
      const result = this.page.locator('.select2-results__option, .select2-results__options li').filter({ hasText: new RegExp(facultyName) }).first();
      if (await result.count()) {
        await result.click();
      } else {
        // 見つからない場合は一旦閉じる（Esc）し、直接入力へフォールバック
        await this.page.keyboard.press('Escape').catch(() => {});
      }
    } else {
      await facultySelector.fill(facultyName);
      const option = this.page.getByRole('option', { name: new RegExp(facultyName) }).first();
      if (await option.count()) {
        await option.click();
      } else {
        // 典型的なオートコンプリートの候補
        const menuItem = this.page.getByRole('listbox').locator('*, [role="option"]').filter({ hasText: new RegExp(facultyName) }).first();
        if (await menuItem.count()) await menuItem.click();
      }
    }

    const nameInput =
      this.page.getByLabel(/学科名|専攻名|名称|Name/i).first()
        .or(this.page.getByPlaceholder(/学科|専攻|名称|Name/i).first())
        .or(this.page.getByRole('textbox', { name: /学科|専攻|名称|Name/i }).first());

    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);

    const save = this.page.getByRole('button', { name: /保存|登録|Save|作成/i })
      .or(this.page.getByRole('link', { name: /保存|登録|Save|作成/i }))
      .or(this.page.locator('button, a', { hasText: /保存|登録|Save|作成/i }));
    await save.first().click();

    // 保存後は詳細へ遷移するUIがあるため、一覧へ戻って存在確認
    await this.gotoSubjectList();

    const row = this.page.getByRole('row').filter({
      has: this.page.getByText(new RegExp(`${facultyName}`)),
      has: this.page.getByText(new RegExp(`${name}`)),
    }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  private async gotoSubjectList(): Promise<void> {
    const link = this.page
      .locator('a[href$="/university/university_subjects"]')
      .or(this.page.getByRole('link', { name: /学科\s*\/\s*専攻一覧|学科専攻一覧|一覧|戻る/i }));

    if (await link.first().count()) {
      try {
        await Promise.all([
          this.page.waitForURL(/\/university_subjects(\?.*)?$/, { timeout: 4000 }),
          link.first().click({ timeout: 1000 })
        ]);
      } catch {}
    }

    if (!/\/university_subjects(\?.*)?$/.test(this.page.url())) {
      const indexUrl = new URL('/ja/university/university_subjects', new URL(this.page.url()).origin).toString();
      await this.page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
    }
    await expect(this.page.getByRole('heading', { name: /学科|専攻.*一覧|Department/i }))
      .toBeVisible({ timeout: 5000 }).catch(() => {});
  }
}
