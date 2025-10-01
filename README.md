# TAO Login OTP E2E (Playwright + TypeScript)

最小依存（@playwright/test のみ）で、TAO 管理画面にログインし、メールに届いた 6 桁 OTP をターミナル入力→画面に転記してダッシュボード到達を検証するシナリオです。

## 前提
- Node.js / npm が導入済み
- ブラウザは Playwright が自動取得（Chromium）
- CI は使いません（ローカル実行前提）

## セットアップ
```bash
cd tao-login-otp-e2e
npm i -D @playwright/test@^1.47.0
npx playwright install chromium
```

## 環境変数
以下をシェルで `export` してください（.env 読み込み機構は入れていません）。

```bash
export TAO_BASE_URL="https://stg.admissions-office.net/ja/admin/sign_in"  # ログインまたは保護ルート
export TAO_ADMIN_EMAIL="admin@example.com"                                  # ログインID
export TAO_ADMIN_PASSWORD="********"                                        # ログインPW
# 任意: ステージングが Basic 認証で保護されている場合
export TAO_BASIC_AUTH_USER="stg-user"
export TAO_BASIC_AUTH_PASSWORD="stg-pass"
```

補足:
- `TAO_BASE_URL` は保護ルートでも構いません。テストが自動でログイン URL 候補（/ja/admin/sign_in, /admin/sign_in, /ja/admin/login など）へフォールバックします。
- Basic 認証は httpCredentials / Authorization ヘッダ / ルーティング経由で付与します。

## 実行
- 通常実行
```bash
npx playwright test
```
- UI で進行を目視
```bash
npx playwright test --ui
```
- レポート確認
```bash
npx playwright show-report
```

実行中、ターミナルに「メールに届いた6桁コードを入力してください:」と表示されたら OTP を手入力して Enter してください。

## 成功条件
- テストが緑で終了（exit code 0）
- 画面が「ダッシュボード」等の到達見出しを表示
- HTML レポートやトレースにエラーなし

## トラブルシュート
- 401（HTTP Basic: Access denied）
  - `TAO_BASIC_AUTH_USER` / `TAO_BASIC_AUTH_PASSWORD` を設定
  - リダイレクトで別ホストに移る場合はそのホストにも認証が必要です
- 404（直接リンクで Not Found）
  - SPA でサーバリライトが無い場合に発生します。`/ja/admin/sign_in` など既知のログイン URL を指定
- セレクタ待機タイムアウト
  - ログインフォームが描画されていない可能性があります。401/404 の発生有無を Console/Network で確認

## 主要ファイル
- `playwright.config.ts` … タイムアウト、レポーター、デバイス、トレース、Basic 認証
- `src/utils/otp.ts` … 標準入力で 6 桁 OTP を受け取る
- `src/pages/login.page.ts` … ラベル/ロール中心のセレクタとフォールバック遷移
- `src/specs/login.otp.spec.ts` … ログイン→OTP→到達検証
- `.env.example` … 環境変数の雛形

## 免責
- 依存は @playwright/test のみ。CI・Gmail API は含みません。

