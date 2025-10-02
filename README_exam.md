# 入試の作成（総合選抜）自動化

## 使い方
- `src/data/exam.ts` の `exams` 配列を編集
  - `name`: 募集名称（総合選抜を明示）
  - `department`: 既存の学科名（学部→学科の作成が完了している前提）
  - `language`, `feeExemptionCode`, `examDate`, `venue`: 画面項目がある場合のみ使用
- 未来日ポリシー（Asia/Tokyo 前提）
  - `startAt`: 今日から +180日
  - `endAt`: `startAt` +30日
- 実行
  - `npx playwright test tests/exam.create.sogo.spec.ts`
  - または `npm run test -g "入試の作成（総合選抜）"`

## 注意
- 同名の募集があればスキップ（冪等）
- ラベル/入力型が異なる場合は `src/pages/exam.page.ts` の正規表現と `fillDateTimeFlexible` を調整してください

