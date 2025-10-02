import { Page, expect } from '@playwright/test';
import { computeFutureRange, toInputValue, ExamInput } from '../data/exam';

export class ExamPage {
  constructor(private page: Page) {}

  async openRecruitmentManager() {
    const menu = this.page.getByRole('link', { name: /募集管理|募集|入試|Recruitment/i })
      .or(this.page.getByRole('button', { name: /募集管理|募集|入試/i }))
      .or(this.page.locator('a,button').filter({ hasText: /募集管理|募集|入試/ }));
    await expect(menu.first()).toBeVisible();
    await menu.first().click();
    await expect(this.page.getByRole('heading', { name: /募集|入試|Recruitment/i })).toBeVisible({ timeout: 10000 });
  }

  async createIfNotExists(input: ExamInput) {
    // 既存判定（一覧/詳細）
    const existsRow = this.page.getByRole('row', { name: new RegExp(input.name) })
      .or(this.page.getByText(input.name));
    if (await existsRow.count() > 0) return;

    // 新規（＋）
    const add = this.page.getByRole('button', { name: /新規募集|新規|新規作成|追加|Create|＋/i })
      .or(this.page.locator('a[data-title*="追加"]'))
      .or(this.page.locator('a:has(i.fa-plus)'))
      .or(this.page.locator('a.btn:has(i[class*="fa-plus"])'))
      .or(this.page.getByRole('link', { name: /新規|＋/i }));
    const addBtn = add.first();
    await expect(addBtn).toBeVisible();
    await addBtn.scrollIntoViewIfNeeded();
    try {
      await Promise.all([
        this.page.waitForURL(/new$/, { timeout: 5000 }).catch(() => {}),
        addBtn.click()
      ]);
    } catch {
      // noop
    }

    // 募集名称
    const nameInput = this.page.getByLabel(/募集名称|入試名称|名称|タイトル|Name/i).first()
      .or(this.page.getByPlaceholder(/募集名称|入試名称|名称|Title|Name/i).first());
    await expect(nameInput).toBeVisible();
    await nameInput.fill(input.name);

    // 所属学科
    const deptSelector = this.page.getByLabel(/所属学科|学科|Department|所属|配属/i).first()
      .or(this.page.getByPlaceholder(/所属学科|学科|Department/i).first());
    await expect(deptSelector).toBeVisible();
    const tagName = (await deptSelector.evaluate(el => (el as HTMLElement).tagName)).toUpperCase();
    const cls = (await deptSelector.getAttribute('class')) || '';
    const isSelect2 = cls.includes('select2-hidden-accessible');
    if (tagName === 'SELECT' && !isSelect2) {
      await deptSelector.selectOption({ label: input.department });
    } else if (isSelect2) {
      const opener = deptSelector.locator('xpath=following-sibling::span[contains(@class,"select2")]//span[contains(@class,"select2-selection")]').first();
      await opener.click();
      const search = this.page.locator('input.select2-search__field');
      if (await search.count()) await search.fill(input.department);
      const result = this.page.locator('.select2-results__option, .select2-results__options li').filter({ hasText: new RegExp(input.department) }).first();
      await result.click();
    } else {
      await deptSelector.fill(input.department);
      const option = this.page.getByRole('option', { name: new RegExp(input.department) }).first();
      if (await option.count()) await option.click();
      else await this.page.keyboard.press('Enter');
    }

    // 言語（任意）
    if (input.language) {
      const langSelector = this.page.getByLabel(/言語|Language/i).first()
        .or(this.page.getByPlaceholder(/言語|Language/i).first());
      if (await langSelector.count()) {
        const t = (await langSelector.evaluate(el => (el as HTMLElement).tagName)).toUpperCase();
        if (t === 'SELECT') {
          await langSelector.selectOption({ label: input.language });
        } else {
          await langSelector.fill(input.language);
          const opt = this.page.getByRole('option', { name: new RegExp(input.language) }).first();
          if (await opt.count()) await opt.click();
          else await this.page.keyboard.press('Enter');
        }
      }
    }

    // 未来日
    const { start, end } = computeFutureRange();
    await this.fillDateTimeFlexible([/募集開始日時|開始日時|Start/i], start);
    await this.fillDateTimeFlexible([/募集締切日時|締切|End|Deadline/i], end);

    // 検定料免除コード
    if (input.feeExemptionCode) {
      const codeInput = this.page.getByLabel(/免除コード|検定料免除|免除|Exemption Code/i).first()
        .or(this.page.getByPlaceholder(/免除コード|Exemption/i).first());
      if (await codeInput.count()) await codeInput.fill(input.feeExemptionCode);
    }

    // 試験日・会場（任意項目）
    if (input.examDate) {
      await this.fillDateTimeFlexible([/試験日|Exam Date/i], new Date(input.examDate));
    }
    if (input.venue) {
      const venueInput = this.page.getByLabel(/会場|試験会場|Venue|Location/i).first()
        .or(this.page.getByPlaceholder(/会場|Venue|Location/i).first());
      if (await venueInput.count()) await venueInput.fill(input.venue);
    }

    const save = this.page.getByRole('button', { name: /保存|登録|Save|作成/i })
      .or(this.page.getByRole('link', { name: /保存|登録|Save|作成/i }))
      .or(this.page.locator('button, a', { hasText: /保存|登録|Save|作成/i }));
    await save.first().click();

    // 成功判定: 一覧に名称が見える
    await expect(this.page.getByText(input.name, { exact: false })).toBeVisible({ timeout: 15000 });
  }

  private async fillDateTimeFlexible(labelRegexes: RegExp[], dt: Date) {
    for (const rx of labelRegexes) {
      const control = this.page.getByLabel(rx).first().or(this.page.getByPlaceholder(rx).first());
      if (!(await control.count())) continue;
      const type = await control.evaluate(el => (el as HTMLInputElement).type || '');
      if (type === 'datetime-local') { await control.fill(toInputValue(dt, 'datetime')); return; }
      if (type === 'date')           { await control.fill(toInputValue(dt, 'date'));     return; }
      try { await control.fill(toInputValue(dt, 'datetime').replace('T', ' ')); }
      catch { await control.fill(toInputValue(dt, 'date')); }
      return;
    }
  }
}

