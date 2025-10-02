# TAO Admin Login E2E (Playwright)

## セットアップ
- Node.js LTS を用意
- npm ci または npm i
- .env を作成し、.env.example を参考に値を設定
- macOS/Linux の例: `export $(grep -v '^#' .env | xargs)`

## 実行
- ヘッドレス: `npm run test`
- ヘッドフル（目視）: `npm run test:headed`
- デバッグ（スローモ＋インスペクタ）: `npm run test:debug`
- UI デバッグ: `npm run test:ui`
- レポート: `npm run report`

## 成功条件
- テストが成功し、ログイン後にナビゲーションと管理メニューリンクが可視
