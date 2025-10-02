# 階層構造の自動作成（千葉大学 理学部）

## 使い方
- src/data/org.ts の faculties / departments は以下の前提で初期化済み
  - 学部: 理学部
  - 学科: 物理学科、地球科学科
- 既存のログインテストと同じ .env を利用（TAO_BASE_URL, TAO_ADMIN_EMAIL, TAO_ADMIN_PASSWORD, BASIC_AUTH_*）
- 実行:
  - `npm run test -g "千葉大学 理学部"`
  - もしくはファイル指定: `npx playwright test tests/hierarchy.chiba-science.spec.ts`

## 実装メモ
- 冪等性のため、一覧の行に同名がある場合はスキップ
- 文言の揺れに備え、ボタン・入力欄・見出しは正規表現ロケータで検索
- 成功判定は一覧に対象名が表示されること

