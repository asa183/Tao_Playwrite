import { test } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { NavPage } from '../src/pages/nav.page';
import { FacultyPage } from '../src/pages/faculty.page';
import { DepartmentPage } from '../src/pages/department.page';
import { faculties, departments } from '../src/data/org';

test.describe('千葉大学 理学部: 階層構造の作成（学部 → 学科）', () => {
  test('理学部の登録', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(process.env.TAO_ADMIN_EMAIL!, process.env.TAO_ADMIN_PASSWORD!);

    const nav = new NavPage(page);
    await nav.openUniversityAdmin();
    await nav.goFacultyList();

    const facultyPage = new FacultyPage(page);
    for (const f of faculties) {
      await facultyPage.createIfNotExists(f.name);
    }
  });

  test('理学部配下の学科登録（物理学科・地球科学科）', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(process.env.TAO_ADMIN_EMAIL!, process.env.TAO_ADMIN_PASSWORD!);

    const nav = new NavPage(page);
    await nav.openUniversityAdmin();
    // 先に親学部を確実に作成（冪等）
    await nav.goFacultyList();
    const facultyPage = new FacultyPage(page);
    for (const f of faculties) {
      await facultyPage.createIfNotExists(f.name);
    }
    // 学科一覧へ
    await nav.goDepartmentList();

    const deptPage = new DepartmentPage(page);
    for (const d of departments) {
      await deptPage.createIfNotExists(d.name, d.facultyName);
    }
  });
});
