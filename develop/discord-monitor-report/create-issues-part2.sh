#!/bin/bash

GH="C:/Program Files/GitHub CLI/gh.exe"

echo "残りのIssuesを作成します（11-20）..."

# Issue 11-20
"$GH" issue create --title "サーバーマスタ一覧API（GET /api/masters/servers）" --body "## 概要
サーバーマスタ一覧を取得するAPIを実装する。

## タスク
- [ ] app/api/masters/servers/route.ts 作成（GET）
- [ ] クエリパラメータ（is_active）の処理
- [ ] Prismaでサーバー一覧取得
- [ ] 権限チェック（上長のみ）
- [ ] APIテスト作成

## 受け入れ条件
- サーバー一覧が取得できる
- 上長のみアクセス可能

## ラベル: feature, api, master, Phase-3"

"$GH" issue create --title "サーバーマスタ作成・更新・削除API" --body "## 概要
サーバーマスタのCRUD APIを実装する。

## タスク
- [ ] POST /api/masters/servers - 新規作成
- [ ] PUT /api/masters/servers/[id] - 更新
- [ ] DELETE /api/masters/servers/[id] - 削除（使用中チェック）
- [ ] Zodスキーマ定義
- [ ] APIテスト作成

## 受け入れ条件
- CRUD操作が正常に動作する
- 使用中のサーバーは削除できない

## ラベル: feature, api, master, Phase-3"

"$GH" issue create --title "担当者マスタAPI（CRUD）" --body "## 概要
担当者マスタのCRUD APIを実装する。

## タスク
- [ ] GET /api/masters/users - 一覧取得
- [ ] POST /api/masters/users - 新規作成
- [ ] PUT /api/masters/users/[id] - 更新
- [ ] DELETE /api/masters/users/[id] - 削除
- [ ] パスワードハッシュ化処理
- [ ] APIテスト作成

## 受け入れ条件
- CRUD操作が正常に動作する
- パスワードがハッシュ化されて保存される

## ラベル: feature, api, master, Phase-3"

"$GH" issue create --title "マスタ管理画面（SCR-005）の実装" --body "## 概要
マスタ管理画面UIを実装する。

## タスク
- [ ] app/masters/page.tsx 作成
- [ ] タブコンポーネント（サーバー・担当者）
- [ ] テーブルコンポーネント実装
- [ ] モーダルダイアログ（新規作成・編集）
- [ ] 削除確認ダイアログ
- [ ] 権限チェック（上長のみアクセス可）

## 受け入れ条件
- 上長のみアクセス可能
- サーバー・担当者のCRUD操作ができる

## ラベル: feature, ui, master, Phase-3"

"$GH" issue create --title "日報一覧API（GET /api/reports）" --body "## 概要
日報一覧を取得するAPIを実装する。

## タスク
- [ ] app/api/reports/route.ts 作成（GET）
- [ ] クエリパラメータ（user_id, start_date, end_date, page, limit）
- [ ] 権限別フィルタリング（担当者は自分のみ、上長は全員）
- [ ] ページネーション実装
- [ ] 監視件数・コメント件数の集計
- [ ] APIテスト作成

## 受け入れ条件
- 担当者は自分の日報のみ取得できる
- 上長は全員の日報を取得できる
- ページネーションが動作する

## ラベル: feature, api, report, Phase-4"

"$GH" issue create --title "日報詳細API（GET /api/reports/[id]）" --body "## 概要
日報詳細を取得するAPIを実装する。

## タスク
- [ ] app/api/reports/[id]/route.ts 作成（GET）
- [ ] 監視報告一覧を含める（JOIN）
- [ ] コメント一覧を含める（JOIN）
- [ ] 権限チェック（自分の日報または上長）
- [ ] APIテスト作成

## 受け入れ条件
- 日報詳細が取得できる
- 監視報告とコメントが含まれる

## ラベル: feature, api, report, Phase-4"

"$GH" issue create --title "日報作成API（POST /api/reports）" --body "## 概要
日報を作成するAPIを実装する。

## タスク
- [ ] app/api/reports/route.ts 作成（POST）
- [ ] リクエストボディのZodスキーマ定義
- [ ] トランザクション処理（日報+監視報告を一括登録）
- [ ] バリデーション（監視報告1件以上）
- [ ] APIテスト作成

## 受け入れ条件
- 日報と監視報告が同時に作成される
- 監視報告が0件の場合はエラーが返る

## ラベル: feature, api, report, Phase-4"

"$GH" issue create --title "日報更新API（PUT /api/reports/[id]）" --body "## 概要
日報を更新するAPIを実装する。

## タスク
- [ ] app/api/reports/[id]/route.ts 作成（PUT）
- [ ] 権限チェック（本人のみ）
- [ ] 監視報告の追加・更新・削除処理
- [ ] トランザクション処理
- [ ] APIテスト作成

## 受け入れ条件
- 本人のみ更新できる
- 監視報告が正しく更新される

## ラベル: feature, api, report, Phase-4"

"$GH" issue create --title "日報削除API（DELETE /api/reports/[id]）" --body "## 概要
日報を削除するAPIを実装する。

## タスク
- [ ] app/api/reports/[id]/route.ts 作成（DELETE）
- [ ] 権限チェック（本人のみ）
- [ ] カスケード削除（監視報告、コメントも削除）
- [ ] APIテスト作成

## 受け入れ条件
- 本人のみ削除できる
- 関連データも削除される

## ラベル: feature, api, report, Phase-4"

"$GH" issue create --title "ホーム画面（SCR-002）の実装" --body "## 概要
ホーム画面（日報一覧）UIを実装する。

## タスク
- [ ] app/page.tsx または app/home/page.tsx 作成
- [ ] 日報カードコンポーネント
- [ ] フィルタコンポーネント（担当者、期間）
- [ ] ページネーション
- [ ] 新規日報作成ボタン
- [ ] マスタ管理ボタン（上長のみ表示）
- [ ] レスポンシブデザイン

## 受け入れ条件
- 日報一覧が表示される
- フィルタとページネーションが動作する

## ラベル: feature, ui, report, Phase-4"

echo "✅ Issue 11-20を作成しました！"
