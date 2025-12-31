#!/bin/bash

# Discord監視日報システム - GitHub Issues 一括作成スクリプト

set -e

echo "GitHub Issues を作成します..."
echo ""

# Phase 1: セットアップ・環境構築

gh issue create \
  --title "プロジェクト初期セットアップ（Next.js + TypeScript）" \
  --label "setup,Phase-1" \
  --body "## 概要
Next.js (App Router) プロジェクトを作成し、必要な依存関係をインストールする。

## タスク
- [ ] \`npx create-next-app@latest\` でプロジェクト作成
- [ ] TypeScript設定（tsconfig.json）
- [ ] ESLint設定
- [ ] Prettier設定
- [ ] \`.gitignore\` 設定
- [ ] \`package.json\` のスクリプト設定（lint, tsc, test, dev, build）

## 受け入れ条件
- \`npm run dev\` で開発サーバーが起動する
- \`npm run lint\` が正常に動作する
- \`npm run tsc\` で型チェックが通る"

gh issue create \
  --title "Tailwind CSS + shadcn/ui のセットアップ" \
  --label "setup,ui,Phase-1" \
  --body "## 概要
UIコンポーネントライブラリをセットアップする。

## タスク
- [ ] Tailwind CSSのインストールと設定
- [ ] shadcn/uiの初期化（\`npx shadcn-ui@latest init\`）
- [ ] 必要なコンポーネントのインストール（Button, Input, Card, Dialog, Select, Textarea等）
- [ ] カスタムテーマの設定（日本語フォント、カラースキーム）

## 受け入れ条件
- shadcn/uiのコンポーネントが正常にインポートできる
- Tailwindのユーティリティクラスが動作する"

gh issue create \
  --title "Prisma ORM のセットアップとスキーマ定義" \
  --label "setup,database,Phase-1" \
  --body "## 概要
Prismaをセットアップし、ER図に基づいてデータベーススキーマを定義する。

## タスク
- [ ] Prismaのインストール（\`npm install prisma @prisma/client\`）
- [ ] Prisma初期化（\`npx prisma init\`）
- [ ] \`schema.prisma\` にER図のスキーマを実装
  - User（ユーザー）
  - DiscordServer（サーバーマスタ）
  - DailyReport（日報）
  - MonitoringRecord（監視報告）
  - Comment（コメント）
- [ ] マイグレーションファイル作成
- [ ] Prisma Client生成

## 受け入れ条件
- \`npx prisma db push\` でスキーマがDBに反映される
- \`npx prisma studio\` でデータベースが確認できる
- リレーションが正しく設定されている

## 参考
[ER図](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/画面定義書.md)"

gh issue create \
  --title "Vitest テストフレームワークのセットアップ" \
  --label "setup,testing,Phase-1" \
  --body "## 概要
Vitestをセットアップし、テスト環境を構築する。

## タスク
- [ ] Vitestのインストール
- [ ] \`vitest.config.ts\` 設定
- [ ] テスト用のヘルパー関数作成
- [ ] サンプルテストを作成して動作確認

## 受け入れ条件
- \`npm run test\` でテストが実行される
- Next.jsのコンポーネントとAPIルートがテスト可能"

gh issue create \
  --title "環境変数の設定とシークレット管理" \
  --label "setup,security,Phase-1" \
  --body "## 概要
開発・本番環境の環境変数を設定する。

## タスク
- [ ] \`.env.example\` ファイル作成
- [ ] \`.env.local\` ファイル作成（gitignore）
- [ ] 環境変数の型定義（\`env.ts\`）
- [ ] 環境変数バリデーション（Zod）

## 必要な環境変数
\`\`\`
DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_API_URL
\`\`\`

## 受け入れ条件
- 環境変数が正しく読み込まれる
- 型安全に環境変数にアクセスできる"

# Phase 2: 認証機能

gh issue create \
  --title "JWT認証の実装準備" \
  --label "feature,auth,Phase-2" \
  --body "## 概要
JWT（JSON Web Token）を使った認証機能の基盤を作成する。

## タスク
- [ ] \`jsonwebtoken\` または \`jose\` ライブラリのインストール
- [ ] \`bcryptjs\` のインストール（パスワードハッシュ化）
- [ ] JWT生成・検証関数の実装（\`lib/auth.ts\`）
- [ ] ミドルウェアの実装（認証チェック）

## 受け入れ条件
- JWTトークンが生成・検証できる
- パスワードがハッシュ化できる"

gh issue create \
  --title "ログインAPI（POST /api/auth/login）の実装" \
  --label "feature,auth,api,Phase-2" \
  --body "## 概要
ユーザーログイン機能を実装する。

## タスク
- [ ] \`app/api/auth/login/route.ts\` 作成
- [ ] リクエストボディのZodスキーマ定義
- [ ] メール・パスワード検証ロジック
- [ ] JWTトークン発行
- [ ] エラーハンドリング（401 Unauthorized）
- [ ] APIテスト作成

## 受け入れ条件
- 正しい認証情報でトークンが取得できる
- 誤った認証情報で401エラーが返る
- APIテストが全て通る

## API仕様
[API仕様書 - ログイン](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/API仕様書.md#21-ログイン)"

gh issue create \
  --title "ユーザー情報取得API（GET /api/auth/me）の実装" \
  --label "feature,auth,api,Phase-2" \
  --body "## 概要
ログイン中のユーザー情報を取得するAPIを実装する。

## タスク
- [ ] \`app/api/auth/me/route.ts\` 作成
- [ ] Authorizationヘッダーからトークン取得
- [ ] トークン検証
- [ ] ユーザー情報取得（Prisma）
- [ ] APIテスト作成

## 受け入れ条件
- 有効なトークンでユーザー情報が取得できる
- 無効なトークンで401エラーが返る"

gh issue create \
  --title "ログアウトAPI（POST /api/auth/logout）の実装" \
  --label "feature,auth,api,Phase-2" \
  --body "## 概要
ログアウト機能を実装する。

## タスク
- [ ] \`app/api/auth/logout/route.ts\` 作成
- [ ] クライアント側のトークン削除処理
- [ ] APIテスト作成

## 受け入れ条件
- ログアウトが成功する
- トークンが無効化される"

gh issue create \
  --title "ログイン画面（SCR-001）の実装" \
  --label "feature,auth,ui,Phase-2" \
  --body "## 概要
ログイン画面UIを実装する。

## タスク
- [ ] \`app/login/page.tsx\` 作成
- [ ] フォームコンポーネント実装（shadcn/ui Form）
- [ ] バリデーション（Zod + React Hook Form）
- [ ] ログインAPI呼び出し
- [ ] エラーメッセージ表示
- [ ] ログイン成功時にホーム画面へリダイレクト
- [ ] レスポンシブデザイン対応

## 受け入れ条件
- メール・パスワードが入力できる
- ログイン成功でホーム画面へ遷移
- エラーメッセージが日本語で表示される

## 画面仕様
[画面定義書 - ログイン画面](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/画面定義書.md#1-ログイン画面)"

# Phase 3: マスタ管理機能

gh issue create \
  --title "サーバーマスタ一覧API（GET /api/masters/servers）" \
  --label "feature,api,master,Phase-3" \
  --body "## 概要
サーバーマスタ一覧を取得するAPIを実装する。

## タスク
- [ ] \`app/api/masters/servers/route.ts\` 作成（GET）
- [ ] クエリパラメータ（is_active）の処理
- [ ] Prismaでサーバー一覧取得
- [ ] 権限チェック（上長のみ）
- [ ] APIテスト作成

## 受け入れ条件
- サーバー一覧が取得できる
- 上長のみアクセス可能"

gh issue create \
  --title "サーバーマスタ作成・更新・削除API" \
  --label "feature,api,master,Phase-3" \
  --body "## 概要
サーバーマスタのCRUD APIを実装する。

## タスク
- [ ] POST \`/api/masters/servers\` - 新規作成
- [ ] PUT \`/api/masters/servers/[id]\` - 更新
- [ ] DELETE \`/api/masters/servers/[id]\` - 削除（使用中チェック）
- [ ] Zodスキーマ定義
- [ ] APIテスト作成

## 受け入れ条件
- CRUD操作が正常に動作する
- 使用中のサーバーは削除できない"

gh issue create \
  --title "担当者マスタAPI（CRUD）" \
  --label "feature,api,master,Phase-3" \
  --body "## 概要
担当者マスタのCRUD APIを実装する。

## タスク
- [ ] GET \`/api/masters/users\` - 一覧取得
- [ ] POST \`/api/masters/users\` - 新規作成
- [ ] PUT \`/api/masters/users/[id]\` - 更新
- [ ] DELETE \`/api/masters/users/[id]\` - 削除
- [ ] パスワードハッシュ化処理
- [ ] APIテスト作成

## 受け入れ条件
- CRUD操作が正常に動作する
- パスワードがハッシュ化されて保存される"

gh issue create \
  --title "マスタ管理画面（SCR-005）の実装" \
  --label "feature,ui,master,Phase-3" \
  --body "## 概要
マスタ管理画面UIを実装する。

## タスク
- [ ] \`app/masters/page.tsx\` 作成
- [ ] タブコンポーネント（サーバー・担当者）
- [ ] テーブルコンポーネント実装
- [ ] モーダルダイアログ（新規作成・編集）
- [ ] 削除確認ダイアログ
- [ ] 権限チェック（上長のみアクセス可）

## 受け入れ条件
- 上長のみアクセス可能
- サーバー・担当者のCRUD操作ができる

## 画面仕様
[画面定義書 - マスタ管理画面](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/画面定義書.md#5-マスタ管理画面)"

# Phase 4: 日報機能

gh issue create \
  --title "日報一覧API（GET /api/reports）" \
  --label "feature,api,report,Phase-4" \
  --body "## 概要
日報一覧を取得するAPIを実装する。

## タスク
- [ ] \`app/api/reports/route.ts\` 作成（GET）
- [ ] クエリパラメータ（user_id, start_date, end_date, page, limit）
- [ ] 権限別フィルタリング（担当者は自分のみ、上長は全員）
- [ ] ページネーション実装
- [ ] 監視件数・コメント件数の集計
- [ ] APIテスト作成

## 受け入れ条件
- 担当者は自分の日報のみ取得できる
- 上長は全員の日報を取得できる
- ページネーションが動作する"

gh issue create \
  --title "日報詳細API（GET /api/reports/[id]）" \
  --label "feature,api,report,Phase-4" \
  --body "## 概要
日報詳細を取得するAPIを実装する。

## タスク
- [ ] \`app/api/reports/[id]/route.ts\` 作成（GET）
- [ ] 監視報告一覧を含める（JOIN）
- [ ] コメント一覧を含める（JOIN）
- [ ] 権限チェック（自分の日報または上長）
- [ ] APIテスト作成

## 受け入れ条件
- 日報詳細が取得できる
- 監視報告とコメントが含まれる"

gh issue create \
  --title "日報作成API（POST /api/reports）" \
  --label "feature,api,report,Phase-4" \
  --body "## 概要
日報を作成するAPIを実装する。

## タスク
- [ ] \`app/api/reports/route.ts\` 作成（POST）
- [ ] リクエストボディのZodスキーマ定義
- [ ] トランザクション処理（日報+監視報告を一括登録）
- [ ] バリデーション（監視報告1件以上）
- [ ] APIテスト作成

## 受け入れ条件
- 日報と監視報告が同時に作成される
- 監視報告が0件の場合はエラーが返る"

gh issue create \
  --title "日報更新API（PUT /api/reports/[id]）" \
  --label "feature,api,report,Phase-4" \
  --body "## 概要
日報を更新するAPIを実装する。

## タスク
- [ ] \`app/api/reports/[id]/route.ts\` 作成（PUT）
- [ ] 権限チェック（本人のみ）
- [ ] 監視報告の追加・更新・削除処理
- [ ] トランザクション処理
- [ ] APIテスト作成

## 受け入れ条件
- 本人のみ更新できる
- 監視報告が正しく更新される"

gh issue create \
  --title "日報削除API（DELETE /api/reports/[id]）" \
  --label "feature,api,report,Phase-4" \
  --body "## 概要
日報を削除するAPIを実装する。

## タスク
- [ ] \`app/api/reports/[id]/route.ts\` 作成（DELETE）
- [ ] 権限チェック（本人のみ）
- [ ] カスケード削除（監視報告、コメントも削除）
- [ ] APIテスト作成

## 受け入れ条件
- 本人のみ削除できる
- 関連データも削除される"

gh issue create \
  --title "ホーム画面（SCR-002）の実装" \
  --label "feature,ui,report,Phase-4" \
  --body "## 概要
ホーム画面（日報一覧）UIを実装する。

## タスク
- [ ] \`app/page.tsx\` または \`app/home/page.tsx\` 作成
- [ ] 日報カードコンポーネント
- [ ] フィルタコンポーネント（担当者、期間）
- [ ] ページネーション
- [ ] 新規日報作成ボタン
- [ ] マスタ管理ボタン（上長のみ表示）
- [ ] レスポンシブデザイン

## 受け入れ条件
- 日報一覧が表示される
- フィルタとページネーションが動作する

## 画面仕様
[画面定義書 - ホーム画面](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/画面定義書.md#2-ホーム画面日報一覧)"

gh issue create \
  --title "日報作成・編集画面（SCR-003）の実装" \
  --label "feature,ui,report,Phase-4" \
  --body "## 概要
日報作成・編集画面UIを実装する。

## タスク
- [ ] \`app/reports/new/page.tsx\` 作成（新規作成）
- [ ] \`app/reports/[id]/edit/page.tsx\` 作成（編集）
- [ ] 監視報告の動的追加・削除UI
- [ ] サーバー選択プルダウン（マスタから取得）
- [ ] Problem・Plan入力欄
- [ ] フォームバリデーション
- [ ] 保存・キャンセル処理

## 受け入れ条件
- 監視報告を複数追加できる
- フォームバリデーションが動作する

## 画面仕様
[画面定義書 - 日報作成画面](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/画面定義書.md#3-日報作成編集画面)"

gh issue create \
  --title "日報詳細画面（SCR-004）の実装" \
  --label "feature,ui,report,Phase-4" \
  --body "## 概要
日報詳細画面UIを実装する。

## タスク
- [ ] \`app/reports/[id]/page.tsx\` 作成
- [ ] 日報情報表示
- [ ] 監視報告一覧表示
- [ ] Problem・Plan表示
- [ ] コメント一覧表示（投稿者・日時）
- [ ] 編集ボタン（本人のみ表示）
- [ ] コメント入力欄（上長のみ表示）

## 受け入れ条件
- 日報詳細が表示される
- 権限に応じたボタンが表示される

## 画面仕様
[画面定義書 - 日報詳細画面](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/画面定義書.md#4-日報詳細画面)"

# Phase 5: コメント機能

gh issue create \
  --title "コメント作成API（POST /api/reports/[id]/comments）" \
  --label "feature,api,comment,Phase-5" \
  --body "## 概要
コメントを作成するAPIを実装する。

## タスク
- [ ] \`app/api/reports/[id]/comments/route.ts\` 作成（POST）
- [ ] 権限チェック（上長のみ）
- [ ] target_field（problem/plan）のバリデーション
- [ ] APIテスト作成

## 受け入れ条件
- 上長のみコメント可能
- ProblemまたはPlanに紐づく"

gh issue create \
  --title "コメント更新・削除API" \
  --label "feature,api,comment,Phase-5" \
  --body "## 概要
コメントの更新・削除APIを実装する。

## タスク
- [ ] PUT \`/api/comments/[id]\` - 更新
- [ ] DELETE \`/api/comments/[id]\` - 削除
- [ ] 権限チェック（コメント投稿者のみ）
- [ ] APIテスト作成

## 受け入れ条件
- コメント投稿者のみ編集・削除できる"

gh issue create \
  --title "日報詳細画面にコメント機能を統合" \
  --label "feature,ui,comment,Phase-5" \
  --body "## 概要
日報詳細画面にコメント機能を追加する。

## タスク
- [ ] コメント投稿フォーム実装（上長のみ）
- [ ] コメント一覧表示
- [ ] コメント編集・削除機能
- [ ] リアルタイム更新（オプション）

## 受け入れ条件
- 上長がコメント投稿できる
- コメントが一覧表示される"

# Phase 6: 認証・権限制御

gh issue create \
  --title "Next.js Middleware で認証チェック" \
  --label "feature,auth,middleware,Phase-6" \
  --body "## 概要
Next.js Middlewareで認証チェックを実装する。

## タスク
- [ ] \`middleware.ts\` 作成
- [ ] JWTトークン検証
- [ ] 未認証時はログイン画面へリダイレクト
- [ ] 公開ページ（/login）は除外

## 受け入れ条件
- 未認証ユーザーはログイン画面へリダイレクトされる
- ログイン画面はアクセス可能"

gh issue create \
  --title "権限別アクセス制御の実装" \
  --label "feature,auth,security,Phase-6" \
  --body "## 概要
役割ベースアクセス制御（RBAC）を実装する。

## タスク
- [ ] 権限チェック関数の実装（\`lib/permissions.ts\`）
- [ ] 上長専用ページのアクセス制御
- [ ] API権限チェック統合
- [ ] テスト作成

## 受け入れ条件
- 担当者は自分のリソースのみアクセス可能
- 上長は全てのリソースにアクセス可能"

# Phase 7: テスト

gh issue create \
  --title "主要機能の単体テスト作成" \
  --label "testing,unit-test,Phase-7" \
  --body "## 概要
主要機能の単体テストを作成する。

## タスク
- [ ] 認証関数のテスト（JWT生成・検証、パスワードハッシュ）
- [ ] バリデーションスキーマのテスト（Zod）
- [ ] 権限チェック関数のテスト
- [ ] ユーティリティ関数のテスト

## 受け入れ条件
- 全ての単体テストが通る
- カバレッジ80%以上"

gh issue create \
  --title "API統合テストの実装" \
  --label "testing,integration-test,Phase-7" \
  --body "## 概要
API統合テストを実装する。

## タスク
- [ ] 認証APIテスト（TEST-AUTH-001～005）
- [ ] 日報APIテスト（TEST-REPORT-001～009）
- [ ] コメントAPIテスト（TEST-COMMENT-001～004）
- [ ] マスタ管理APIテスト（TEST-MASTER-001～009）
- [ ] テストカバレッジ80%以上

## 受け入れ条件
- 全ての統合テストが通る
- テスト仕様書のテストケースを実装

## 参考
[テスト仕様書](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/テスト仕様書.md)"

gh issue create \
  --title "E2Eテスト（Playwright）の実装" \
  --label "testing,e2e-test,Phase-7" \
  --body "## 概要
Playwrightを使用してE2Eテストを実装する。

## タスク
- [ ] Playwrightのセットアップ
- [ ] ログインフローのテスト
- [ ] 日報作成フローのテスト
- [ ] コメント投稿フローのテスト
- [ ] 権限制御のテスト

## 受け入れ条件
- 主要な業務フローがE2Eテストでカバーされている"

# Phase 8: デプロイ・運用

gh issue create \
  --title "Dockerイメージのサイズ最適化" \
  --label "deployment,docker,Phase-8" \
  --body "## 概要
Dockerイメージのサイズと ビルド時間を最適化する。

## タスク
- [ ] マルチステージビルドの最適化
- [ ] 不要なファイルの除外（.dockerignore）
- [ ] イメージサイズ削減（Alpine Linuxベース）
- [ ] ビルド時間短縮（キャッシュ活用）

## 受け入れ条件
- イメージサイズが500MB以下
- ビルド時間が5分以内"

gh issue create \
  --title "Cloud Runへの初回デプロイ" \
  --label "deployment,cloud-run,Phase-8" \
  --body "## 概要
Google Cloud Runへの初回デプロイを実施する。

## タスク
- [ ] Google Cloudプロジェクト設定確認
- [ ] Cloud Run APIの有効化
- [ ] シークレット管理（Secret Manager）
- [ ] \`make deploy\` でデプロイ実行
- [ ] デプロイURLの確認

## 受け入れ条件
- Cloud Runにデプロイされている
- アプリケーションが正常に動作する

## 参考
[デプロイ手順](https://github.com/YOUR_USERNAME/discord-monitor-report/blob/main/develop/discord-monitor-report/デプロイ手順.md)"

gh issue create \
  --title "GitHub Actions CI/CDの動作確認" \
  --label "deployment,ci-cd,Phase-8" \
  --body "## 概要
GitHub ActionsのCI/CDパイプラインを検証する。

## タスク
- [ ] PRでのテスト自動実行を確認
- [ ] mainブランチへのpushで自動デプロイを確認
- [ ] デプロイ失敗時のロールバック確認
- [ ] ログ監視とアラート設定

## 受け入れ条件
- CI/CDが正常に動作する
- デプロイが自動化されている"

gh issue create \
  --title "本番環境のDBマイグレーション手順確立" \
  --label "deployment,database,Phase-8" \
  --body "## 概要
本番環境のデータベースマイグレーション手順を確立する。

## タスク
- [ ] マイグレーション実行手順のドキュメント化
- [ ] Cloud Run Jobsでのマイグレーション実行
- [ ] ロールバック手順の確立
- [ ] バックアップ戦略

## 受け入れ条件
- マイグレーション手順が文書化されている
- 安全にマイグレーションが実行できる"

gh issue create \
  --title "Cloud Runのモニタリングとログ設定" \
  --label "deployment,monitoring,Phase-8" \
  --body "## 概要
Cloud Runのモニタリングとログ設定を行う。

## タスク
- [ ] Cloud Loggingの設定
- [ ] エラーログのアラート設定
- [ ] パフォーマンスメトリクスの監視
- [ ] アクセスログの分析

## 受け入れ条件
- ログが適切に収集されている
- エラー時にアラートが通知される"

# Phase 9: ドキュメント・改善

gh issue create \
  --title "プロジェクトREADME.mdの作成" \
  --label "documentation,Phase-9" \
  --body "## 概要
プロジェクトREADMEを作成する。

## タスク
- [ ] プロジェクト概要
- [ ] セットアップ手順
- [ ] 開発コマンド一覧
- [ ] デプロイ手順
- [ ] トラブルシューティング

## 受け入れ条件
- 新規開発者がREADMEを読んで環境構築できる"

gh issue create \
  --title "OpenAPI仕様からAPI仕様書を自動生成" \
  --label "documentation,api,Phase-9" \
  --body "## 概要
OpenAPI仕様を定義し、API仕様書を自動生成する。

## タスク
- [ ] OpenAPI仕様ファイル作成（YAML/JSON）
- [ ] Swagger UIの統合
- [ ] API仕様書の自動生成設定

## 受け入れ条件
- OpenAPI仕様が定義されている
- Swagger UIでAPIが確認できる"

gh issue create \
  --title "パフォーマンスチューニング" \
  --label "enhancement,performance,Phase-9" \
  --body "## 概要
アプリケーションのパフォーマンスを最適化する。

## タスク
- [ ] データベースクエリの最適化（N+1問題）
- [ ] ページロード時間の短縮
- [ ] 画像最適化
- [ ] キャッシュ戦略の実装

## 受け入れ条件
- ページロード時間が2秒以内
- Lighthouse スコア90以上"

gh issue create \
  --title "セキュリティベストプラクティスの適用" \
  --label "security,Phase-9" \
  --body "## 概要
セキュリティベストプラクティスを適用する。

## タスク
- [ ] SQLインジェクション対策確認
- [ ] XSS対策確認
- [ ] CSRF対策確認
- [ ] 依存関係の脆弱性スキャン（npm audit）
- [ ] セキュリティヘッダーの設定

## 受け入れ条件
- セキュリティテストが全て通る
- 脆弱性が0件"

gh issue create \
  --title "WCAG 2.1 AAレベルのアクセシビリティ対応" \
  --label "enhancement,a11y,Phase-9" \
  --body "## 概要
WCAG 2.1 AAレベルのアクセシビリティに対応する。

## タスク
- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダー対応（ARIA属性）
- [ ] カラーコントラスト比の確認
- [ ] フォーカス管理

## 受け入れ条件
- axe DevToolsで問題が0件
- キーボードのみで操作可能"

echo ""
echo "✅ 全40個のIssueを作成しました！"
echo ""
echo "確認: gh issue list"
