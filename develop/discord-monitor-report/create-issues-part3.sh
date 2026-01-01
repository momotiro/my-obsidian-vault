#!/bin/bash

GH="C:/Program Files/GitHub CLI/gh.exe"

echo "残りのIssuesを作成します（21-30）..."

"$GH" issue create --title "日報作成・編集画面（SCR-003）の実装" --body "## 概要
日報作成・編集画面UIを実装する。

## タスク
- [ ] app/reports/new/page.tsx 作成（新規作成）
- [ ] app/reports/[id]/edit/page.tsx 作成（編集）
- [ ] 監視報告の動的追加・削除UI
- [ ] サーバー選択プルダウン（マスタから取得）
- [ ] Problem・Plan入力欄
- [ ] フォームバリデーション
- [ ] 保存・キャンセル処理

## 受け入れ条件
- 監視報告を複数追加できる
- フォームバリデーションが動作する

## ラベル: feature, ui, report, Phase-4"

"$GH" issue create --title "日報詳細画面（SCR-004）の実装" --body "## 概要
日報詳細画面UIを実装する。

## タスク
- [ ] app/reports/[id]/page.tsx 作成
- [ ] 日報情報表示
- [ ] 監視報告一覧表示
- [ ] Problem・Plan表示
- [ ] コメント一覧表示（投稿者・日時）
- [ ] 編集ボタン（本人のみ表示）
- [ ] コメント入力欄（上長のみ表示）

## 受け入れ条件
- 日報詳細が表示される
- 権限に応じたボタンが表示される

## ラベル: feature, ui, report, Phase-4"

"$GH" issue create --title "コメント作成API（POST /api/reports/[id]/comments）" --body "## 概要
コメントを作成するAPIを実装する。

## タスク
- [ ] app/api/reports/[id]/comments/route.ts 作成（POST）
- [ ] 権限チェック（上長のみ）
- [ ] target_field（problem/plan）のバリデーション
- [ ] APIテスト作成

## 受け入れ条件
- 上長のみコメント可能
- ProblemまたはPlanに紐づく

## ラベル: feature, api, comment, Phase-5"

"$GH" issue create --title "コメント更新・削除API" --body "## 概要
コメントの更新・削除APIを実装する。

## タスク
- [ ] PUT /api/comments/[id] - 更新
- [ ] DELETE /api/comments/[id] - 削除
- [ ] 権限チェック（コメント投稿者のみ）
- [ ] APIテスト作成

## 受け入れ条件
- コメント投稿者のみ編集・削除できる

## ラベル: feature, api, comment, Phase-5"

"$GH" issue create --title "日報詳細画面にコメント機能を統合" --body "## 概要
日報詳細画面にコメント機能を追加する。

## タスク
- [ ] コメント投稿フォーム実装（上長のみ）
- [ ] コメント一覧表示
- [ ] コメント編集・削除機能
- [ ] リアルタイム更新（オプション）

## 受け入れ条件
- 上長がコメント投稿できる
- コメントが一覧表示される

## ラベル: feature, ui, comment, Phase-5"

"$GH" issue create --title "Next.js Middleware で認証チェック" --body "## 概要
Next.js Middlewareで認証チェックを実装する。

## タスク
- [ ] middleware.ts 作成
- [ ] JWTトークン検証
- [ ] 未認証時はログイン画面へリダイレクト
- [ ] 公開ページ（/login）は除外

## 受け入れ条件
- 未認証ユーザーはログイン画面へリダイレクトされる
- ログイン画面はアクセス可能

## ラベル: feature, auth, middleware, Phase-6"

"$GH" issue create --title "権限別アクセス制御の実装" --body "## 概要
役割ベースアクセス制御（RBAC）を実装する。

## タスク
- [ ] 権限チェック関数の実装（lib/permissions.ts）
- [ ] 上長専用ページのアクセス制御
- [ ] API権限チェック統合
- [ ] テスト作成

## 受け入れ条件
- 担当者は自分のリソースのみアクセス可能
- 上長は全てのリソースにアクセス可能

## ラベル: feature, auth, security, Phase-6"

"$GH" issue create --title "主要機能の単体テスト作成" --body "## 概要
主要機能の単体テストを作成する。

## タスク
- [ ] 認証関数のテスト（JWT生成・検証、パスワードハッシュ）
- [ ] バリデーションスキーマのテスト（Zod）
- [ ] 権限チェック関数のテスト
- [ ] ユーティリティ関数のテスト

## 受け入れ条件
- 全ての単体テストが通る
- カバレッジ80%以上

## ラベル: testing, unit-test, Phase-7"

"$GH" issue create --title "API統合テストの実装" --body "## 概要
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

## ラベル: testing, integration-test, Phase-7"

"$GH" issue create --title "E2Eテスト（Playwright）の実装" --body "## 概要
Playwrightを使用してE2Eテストを実装する。

## タスク
- [ ] Playwrightのセットアップ
- [ ] ログインフローのテスト
- [ ] 日報作成フローのテスト
- [ ] コメント投稿フローのテスト
- [ ] 権限制御のテスト

## 受け入れ条件
- 主要な業務フローがE2Eテストでカバーされている

## ラベル: testing, e2e-test, Phase-7"

echo "✅ Issue 21-30を作成しました！"
