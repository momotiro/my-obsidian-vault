# Discord監視日報システム - Issue一覧

## Phase 1: セットアップ・環境構築

### Issue #1: プロジェクト初期セットアップ
**タイトル:** プロジェクト初期セットアップ（Next.js + TypeScript）

**説明:**
Next.js (App Router) プロジェクトを作成し、必要な依存関係をインストールする。

**タスク:**
- [ ] `npx create-next-app@latest` でプロジェクト作成
- [ ] TypeScript設定（tsconfig.json）
- [ ] ESLint設定
- [ ] Prettier設定
- [ ] `.gitignore` 設定
- [ ] `package.json` のスクリプト設定（lint, tsc, test, dev, build）

**受け入れ条件:**
- `npm run dev` で開発サーバーが起動する
- `npm run lint` が正常に動作する
- `npm run tsc` で型チェックが通る

**ラベル:** setup, Phase 1

---

### Issue #2: Tailwind CSS + shadcn/ui セットアップ
**タイトル:** Tailwind CSS + shadcn/ui のセットアップ

**説明:**
UIコンポーネントライブラリをセットアップする。

**タスク:**
- [ ] Tailwind CSSのインストールと設定
- [ ] shadcn/uiの初期化（`npx shadcn-ui@latest init`）
- [ ] 必要なコンポーネントのインストール（Button, Input, Card, Dialog, Select, Textarea等）
- [ ] カスタムテーマの設定（日本語フォント、カラースキーム）

**受け入れ条件:**
- shadcn/uiのコンポーネントが正常にインポートできる
- Tailwindのユーティリティクラスが動作する

**ラベル:** setup, ui, Phase 1

---

### Issue #3: Prismaセットアップとデータベーススキーマ定義
**タイトル:** Prisma ORM のセットアップとスキーマ定義

**説明:**
Prismaをセットアップし、ER図に基づいてデータベーススキーマを定義する。

**タスク:**
- [ ] Prismaのインストール（`npm install prisma @prisma/client`）
- [ ] Prisma初期化（`npx prisma init`）
- [ ] `schema.prisma` にER図のスキーマを実装
  - User（ユーザー）
  - DiscordServer（サーバーマスタ）
  - DailyReport（日報）
  - MonitoringRecord（監視報告）
  - Comment（コメント）
- [ ] マイグレーションファイル作成
- [ ] Prisma Client生成

**受け入れ条件:**
- `npx prisma db push` でスキーマがDBに反映される
- `npx prisma studio` でデータベースが確認できる
- リレーションが正しく設定されている

**ラベル:** setup, database, Phase 1

---

### Issue #4: Vitestセットアップ
**タイトル:** Vitest テストフレームワークのセットアップ

**説明:**
Vitestをセットアップし、テスト環境を構築する。

**タスク:**
- [ ] Vitestのインストール
- [ ] `vitest.config.ts` 設定
- [ ] テスト用のヘルパー関数作成
- [ ] サンプルテストを作成して動作確認

**受け入れ条件:**
- `npm run test` でテストが実行される
- Next.jsのコンポーネントとAPIルートがテスト可能

**ラベル:** setup, testing, Phase 1

---

### Issue #5: 環境変数とシークレット管理
**タイトル:** 環境変数の設定とシークレット管理

**説明:**
開発・本番環境の環境変数を設定する。

**タスク:**
- [ ] `.env.example` ファイル作成
- [ ] `.env.local` ファイル作成（gitignore）
- [ ] 環境変数の型定義（`env.ts`）
- [ ] 環境変数バリデーション（Zod）

**必要な環境変数:**
```
DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_API_URL
```

**受け入れ条件:**
- 環境変数が正しく読み込まれる
- 型安全に環境変数にアクセスできる

**ラベル:** setup, security, Phase 1

---

## Phase 2: 認証機能

### Issue #6: JWT認証ライブラリのセットアップ
**タイトル:** JWT認証の実装準備

**説明:**
JWT（JSON Web Token）を使った認証機能の基盤を作成する。

**タスク:**
- [ ] `jsonwebtoken` または `jose` ライブラリのインストール
- [ ] `bcryptjs` のインストール（パスワードハッシュ化）
- [ ] JWT生成・検証関数の実装（`lib/auth.ts`）
- [ ] ミドルウェアの実装（認証チェック）

**受け入れ条件:**
- JWTトークンが生成・検証できる
- パスワードがハッシュ化できる

**ラベル:** feature, auth, Phase 2

---

### Issue #7: ログインAPI実装
**タイトル:** ログインAPI（POST /api/auth/login）の実装

**説明:**
ユーザーログイン機能を実装する。

**タスク:**
- [ ] `app/api/auth/login/route.ts` 作成
- [ ] リクエストボディのZodスキーマ定義
- [ ] メール・パスワード検証ロジック
- [ ] JWTトークン発行
- [ ] エラーハンドリング（401 Unauthorized）
- [ ] APIテスト作成

**受け入れ条件:**
- 正しい認証情報でトークンが取得できる
- 誤った認証情報で401エラーが返る
- APIテストが全て通る

**ラベル:** feature, auth, api, Phase 2

---

### Issue #8: ユーザー情報取得API実装
**タイトル:** ユーザー情報取得API（GET /api/auth/me）の実装

**説明:**
ログイン中のユーザー情報を取得するAPIを実装する。

**タスク:**
- [ ] `app/api/auth/me/route.ts` 作成
- [ ] Authorizationヘッダーからトークン取得
- [ ] トークン検証
- [ ] ユーザー情報取得（Prisma）
- [ ] APIテスト作成

**受け入れ条件:**
- 有効なトークンでユーザー情報が取得できる
- 無効なトークンで401エラーが返る

**ラベル:** feature, auth, api, Phase 2

---

### Issue #9: ログアウトAPI実装
**タイトル:** ログアウトAPI（POST /api/auth/logout）の実装

**説明:**
ログアウト機能を実装する（クライアント側でトークン削除）。

**タスク:**
- [ ] `app/api/auth/logout/route.ts` 作成
- [ ] クライアント側のトークン削除処理
- [ ] APIテスト作成

**受け入れ条件:**
- ログアウトが成功する
- トークンが無効化される

**ラベル:** feature, auth, api, Phase 2

---

### Issue #10: ログイン画面UI実装
**タイトル:** ログイン画面（SCR-001）の実装

**説明:**
ログイン画面UIを実装する。

**タスク:**
- [ ] `app/login/page.tsx` 作成
- [ ] フォームコンポーネント実装（shadcn/ui Form）
- [ ] バリデーション（Zod + React Hook Form）
- [ ] ログインAPI呼び出し
- [ ] エラーメッセージ表示
- [ ] ログイン成功時にホーム画面へリダイレクト
- [ ] レスポンシブデザイン対応

**受け入れ条件:**
- メール・パスワードが入力できる
- ログイン成功でホーム画面へ遷移
- エラーメッセージが日本語で表示される

**ラベル:** feature, auth, ui, Phase 2

---

## Phase 3: マスタ管理機能

### Issue #11: サーバーマスタ一覧取得API
**タイトル:** サーバーマスタ一覧API（GET /api/masters/servers）

**タスク:**
- [ ] `app/api/masters/servers/route.ts` 作成（GET）
- [ ] クエリパラメータ（is_active）の処理
- [ ] Prismaでサーバー一覧取得
- [ ] 権限チェック（上長のみ）
- [ ] APIテスト作成

**ラベル:** feature, api, master, Phase 3

---

### Issue #12: サーバーマスタCRUD API
**タイトル:** サーバーマスタ作成・更新・削除API

**タスク:**
- [ ] POST `/api/masters/servers` - 新規作成
- [ ] PUT `/api/masters/servers/[id]` - 更新
- [ ] DELETE `/api/masters/servers/[id]` - 削除（使用中チェック）
- [ ] Zodスキーマ定義
- [ ] APIテスト作成

**ラベル:** feature, api, master, Phase 3

---

### Issue #13: 担当者マスタCRUD API
**タイトル:** 担当者マスタAPI（CRUD）

**タスク:**
- [ ] GET `/api/masters/users` - 一覧取得
- [ ] POST `/api/masters/users` - 新規作成
- [ ] PUT `/api/masters/users/[id]` - 更新
- [ ] DELETE `/api/masters/users/[id]` - 削除
- [ ] パスワードハッシュ化処理
- [ ] APIテスト作成

**ラベル:** feature, api, master, Phase 3

---

### Issue #14: マスタ管理画面UI
**タイトル:** マスタ管理画面（SCR-005）の実装

**タスク:**
- [ ] `app/masters/page.tsx` 作成
- [ ] タブコンポーネント（サーバー・担当者）
- [ ] テーブルコンポーネント実装
- [ ] モーダルダイアログ（新規作成・編集）
- [ ] 削除確認ダイアログ
- [ ] 権限チェック（上長のみアクセス可）

**ラベル:** feature, ui, master, Phase 3

---

## Phase 4: 日報機能

### Issue #15: 日報一覧取得API
**タイトル:** 日報一覧API（GET /api/reports）

**タスク:**
- [ ] `app/api/reports/route.ts` 作成（GET）
- [ ] クエリパラメータ（user_id, start_date, end_date, page, limit）
- [ ] 権限別フィルタリング（担当者は自分のみ、上長は全員）
- [ ] ページネーション実装
- [ ] 監視件数・コメント件数の集計
- [ ] APIテスト作成

**ラベル:** feature, api, report, Phase 4

---

### Issue #16: 日報詳細取得API
**タイトル:** 日報詳細API（GET /api/reports/[id]）

**タスク:**
- [ ] `app/api/reports/[id]/route.ts` 作成（GET）
- [ ] 監視報告一覧を含める（JOIN）
- [ ] コメント一覧を含める（JOIN）
- [ ] 権限チェック（自分の日報または上長）
- [ ] APIテスト作成

**ラベル:** feature, api, report, Phase 4

---

### Issue #17: 日報作成API
**タイトル:** 日報作成API（POST /api/reports）

**タスク:**
- [ ] `app/api/reports/route.ts` 作成（POST）
- [ ] リクエストボディのZodスキーマ定義
- [ ] トランザクション処理（日報+監視報告を一括登録）
- [ ] バリデーション（監視報告1件以上）
- [ ] APIテスト作成

**ラベル:** feature, api, report, Phase 4

---

### Issue #18: 日報更新API
**タイトル:** 日報更新API（PUT /api/reports/[id]）

**タスク:**
- [ ] `app/api/reports/[id]/route.ts` 作成（PUT）
- [ ] 権限チェック（本人のみ）
- [ ] 監視報告の追加・更新・削除処理
- [ ] トランザクション処理
- [ ] APIテスト作成

**ラベル:** feature, api, report, Phase 4

---

### Issue #19: 日報削除API
**タイトル:** 日報削除API（DELETE /api/reports/[id]）

**タスク:**
- [ ] `app/api/reports/[id]/route.ts` 作成（DELETE）
- [ ] 権限チェック（本人のみ）
- [ ] カスケード削除（監視報告、コメントも削除）
- [ ] APIテスト作成

**ラベル:** feature, api, report, Phase 4

---

### Issue #20: ホーム画面（日報一覧）UI
**タイトル:** ホーム画面（SCR-002）の実装

**タスク:**
- [ ] `app/page.tsx` または `app/home/page.tsx` 作成
- [ ] 日報カードコンポーネント
- [ ] フィルタコンポーネント（担当者、期間）
- [ ] ページネーション
- [ ] 新規日報作成ボタン
- [ ] マスタ管理ボタン（上長のみ表示）
- [ ] レスポンシブデザイン

**ラベル:** feature, ui, report, Phase 4

---

### Issue #21: 日報作成・編集画面UI
**タイトル:** 日報作成・編集画面（SCR-003）の実装

**タスク:**
- [ ] `app/reports/new/page.tsx` 作成（新規作成）
- [ ] `app/reports/[id]/edit/page.tsx` 作成（編集）
- [ ] 監視報告の動的追加・削除UI
- [ ] サーバー選択プルダウン（マスタから取得）
- [ ] Problem・Plan入力欄
- [ ] フォームバリデーション
- [ ] 保存・キャンセル処理

**ラベル:** feature, ui, report, Phase 4

---

### Issue #22: 日報詳細画面UI
**タイトル:** 日報詳細画面（SCR-004）の実装

**タスク:**
- [ ] `app/reports/[id]/page.tsx` 作成
- [ ] 日報情報表示
- [ ] 監視報告一覧表示
- [ ] Problem・Plan表示
- [ ] コメント一覧表示（投稿者・日時）
- [ ] 編集ボタン（本人のみ表示）
- [ ] コメント入力欄（上長のみ表示）

**ラベル:** feature, ui, report, Phase 4

---

## Phase 5: コメント機能

### Issue #23: コメント作成API
**タイトル:** コメント作成API（POST /api/reports/[id]/comments）

**タスク:**
- [ ] `app/api/reports/[id]/comments/route.ts` 作成（POST）
- [ ] 権限チェック（上長のみ）
- [ ] target_field（problem/plan）のバリデーション
- [ ] APIテスト作成

**ラベル:** feature, api, comment, Phase 5

---

### Issue #24: コメント更新・削除API
**タイトル:** コメント更新・削除API

**タスク:**
- [ ] PUT `/api/comments/[id]` - 更新
- [ ] DELETE `/api/comments/[id]` - 削除
- [ ] 権限チェック（コメント投稿者のみ）
- [ ] APIテスト作成

**ラベル:** feature, api, comment, Phase 5

---

### Issue #25: コメント機能UI統合
**タイトル:** 日報詳細画面にコメント機能を統合

**タスク:**
- [ ] コメント投稿フォーム実装（上長のみ）
- [ ] コメント一覧表示
- [ ] コメント編集・削除機能
- [ ] リアルタイム更新（オプション）

**ラベル:** feature, ui, comment, Phase 5

---

## Phase 6: 認証・権限制御

### Issue #26: 認証ミドルウェア実装
**タイトル:** Next.js Middleware で認証チェック

**タスク:**
- [ ] `middleware.ts` 作成
- [ ] JWTトークン検証
- [ ] 未認証時はログイン画面へリダイレクト
- [ ] 公開ページ（/login）は除外

**ラベル:** feature, auth, middleware, Phase 6

---

### Issue #27: 役割ベースアクセス制御（RBAC）
**タイトル:** 権限別アクセス制御の実装

**タスク:**
- [ ] 権限チェック関数の実装（`lib/permissions.ts`）
- [ ] 上長専用ページのアクセス制御
- [ ] API権限チェック統合
- [ ] テスト作成

**ラベル:** feature, auth, security, Phase 6

---

## Phase 7: テスト

### Issue #28: 単体テスト（ユニットテスト）
**タイトル:** 主要機能の単体テスト作成

**タスク:**
- [ ] 認証関数のテスト（JWT生成・検証、パスワードハッシュ）
- [ ] バリデーションスキーマのテスト（Zod）
- [ ] 権限チェック関数のテスト
- [ ] ユーティリティ関数のテスト

**ラベル:** testing, unit-test, Phase 7

---

### Issue #29: APIテスト（統合テスト）
**タイトル:** API統合テストの実装

**タスク:**
- [ ] 認証APIテスト（TEST-AUTH-001～005）
- [ ] 日報APIテスト（TEST-REPORT-001～009）
- [ ] コメントAPIテスト（TEST-COMMENT-001～004）
- [ ] マスタ管理APIテスト（TEST-MASTER-001～009）
- [ ] テストカバレッジ80%以上

**ラベル:** testing, integration-test, Phase 7

---

### Issue #30: E2Eテスト
**タイトル:** E2Eテスト（Playwright）の実装

**タスク:**
- [ ] Playwrightのセットアップ
- [ ] ログインフローのテスト
- [ ] 日報作成フローのテスト
- [ ] コメント投稿フローのテスト
- [ ] 権限制御のテスト

**ラベル:** testing, e2e-test, Phase 7

---

## Phase 8: デプロイ・運用

### Issue #31: Docker最適化
**タイトル:** Dockerイメージのサイズ最適化

**タスク:**
- [ ] マルチステージビルドの最適化
- [ ] 不要なファイルの除外（.dockerignore）
- [ ] イメージサイズ削減（Alpine Linuxベース）
- [ ] ビルド時間短縮（キャッシュ活用）

**ラベル:** deployment, docker, Phase 8

---

### Issue #32: Cloud Run本番デプロイ
**タイトル:** Cloud Runへの初回デプロイ

**タスク:**
- [ ] Google Cloudプロジェクト設定確認
- [ ] Cloud Run APIの有効化
- [ ] シークレット管理（Secret Manager）
- [ ] `make deploy` でデプロイ実行
- [ ] デプロイURLの確認

**ラベル:** deployment, cloud-run, Phase 8

---

### Issue #33: CI/CDパイプライン検証
**タイトル:** GitHub Actions CI/CDの動作確認

**タスク:**
- [ ] PRでのテスト自動実行を確認
- [ ] mainブランチへのpushで自動デプロイを確認
- [ ] デプロイ失敗時のロールバック確認
- [ ] ログ監視とアラート設定

**ラベル:** deployment, ci-cd, Phase 8

---

### Issue #34: データベースマイグレーション戦略
**タイトル:** 本番環境のDBマイグレーション手順確立

**タスク:**
- [ ] マイグレーション実行手順のドキュメント化
- [ ] Cloud Run Jobsでのマイグレーション実行
- [ ] ロールバック手順の確立
- [ ] バックアップ戦略

**ラベル:** deployment, database, Phase 8

---

### Issue #35: モニタリング・ログ設定
**タイトル:** Cloud Runのモニタリングとログ設定

**タスク:**
- [ ] Cloud Loggingの設定
- [ ] エラーログのアラート設定
- [ ] パフォーマンスメトリクスの監視
- [ ] アクセスログの分析

**ラベル:** deployment, monitoring, Phase 8

---

## Phase 9: ドキュメント・改善

### Issue #36: README作成
**タイトル:** プロジェクトREADME.mdの作成

**タスク:**
- [ ] プロジェクト概要
- [ ] セットアップ手順
- [ ] 開発コマンド一覧
- [ ] デプロイ手順
- [ ] トラブルシューティング

**ラベル:** documentation, Phase 9

---

### Issue #37: API仕様書の自動生成
**タイトル:** OpenAPI仕様からAPI仕様書を自動生成

**タスク:**
- [ ] OpenAPI仕様ファイル作成（YAML/JSON）
- [ ] Swagger UIの統合
- [ ] API仕様書の自動生成設定

**ラベル:** documentation, api, Phase 9

---

### Issue #38: パフォーマンス最適化
**タイトル:** パフォーマンスチューニング

**タスク:**
- [ ] データベースクエリの最適化（N+1問題）
- [ ] ページロード時間の短縮
- [ ] 画像最適化
- [ ] キャッシュ戦略の実装

**ラベル:** enhancement, performance, Phase 9

---

### Issue #39: セキュリティ監査
**タイトル:** セキュリティベストプラクティスの適用

**タスク:**
- [ ] SQLインジェクション対策確認
- [ ] XSS対策確認
- [ ] CSRF対策確認
- [ ] 依存関係の脆弱性スキャン（npm audit）
- [ ] セキュリティヘッダーの設定

**ラベル:** security, Phase 9

---

### Issue #40: アクセシビリティ対応
**タイトル:** WCAG 2.1 AAレベルのアクセシビリティ対応

**タスク:**
- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダー対応（ARIA属性）
- [ ] カラーコントラスト比の確認
- [ ] フォーカス管理

**ラベル:** enhancement, a11y, Phase 9

---

## 合計: 40 Issues
