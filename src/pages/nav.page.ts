import { Page, expect } from '@playwright/test';

export class NavPage {
  constructor(private page: Page) {}

  async openUniversityAdmin() {
    const uniAdmin = this.page.getByRole('link', { name: /大学管理|University Admin|大学|管理/i });
    await expect(uniAdmin).toBeVisible();
    await uniAdmin.click();
  }

  async goFacultyList() {
    const link = this.page.getByRole('link', { name: /学部研究科一覧|学部|研究科|Faculty/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(this.page.getByRole('heading', { name: /学部|研究科|Faculty/i })).toBeVisible({ timeout: 10000 });
  }

  async goDepartmentList() {
    // ドロップダウン内にあるため、まずメニューを開く
    const menu = this.page.getByRole('button', { name: /大学管理|University Admin|大学|管理/i })
      .or(this.page.locator('a.nav-link, button').filter({ hasText: /大学管理|管理/i }));
    if (await menu.count()) {
      await menu.first().click();
    }
    const link = this.page.locator('a[href$="/university/university_subjects"]')
      .or(this.page.getByRole('link', { name: /学科\s*\/\s*専攻一覧|学科専攻一覧|学科|専攻/i }));
    await link.first().click();
    await expect(this.page.getByRole('heading', { name: /学科|専攻|Department/i })).toBeVisible({ timeout: 10000 });
  }
}
