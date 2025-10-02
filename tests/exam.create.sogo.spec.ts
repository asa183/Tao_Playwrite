import { test } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { ExamPage } from '../src/pages/exam.page';
import { exams } from '../src/data/exam';

test.describe('入試の作成（総合選抜）', () => {
  test('総合選抜の募集を作成（未来日・免除コード設定）', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(process.env.TAO_ADMIN_EMAIL!, process.env.TAO_ADMIN_PASSWORD!);

    const exam = new ExamPage(page);
    await exam.openRecruitmentManager();

    for (const e of exams) {
      await exam.createIfNotExists(e);
    }
  });
});

