#!/bin/bash

# Discord監視日報システム - GitHub Issues 一括作成スクリプト（簡略版）

set -e

GH="C:/Program Files/GitHub CLI/gh.exe"

echo "GitHub Issues を作成します..."
echo ""

# Issue 2
"$GH" issue create --title "Tailwind CSS + shadcn/ui のセットアップ" --body "## 概要
UIコンポーネントライブラリをセットアップする。

## タスク
- [ ] Tailwind CSSのインストールと設定
- [ ] shadcn/uiの初期化
- [ ] 必要なコンポーネントのインストール（Button, Input, Card, Dialog, Select, Textarea等）
- [ ] カスタムテーマの設定（日本語フォント、カラースキーム）

## 受け入れ条件
- shadcn/uiのコンポーネントが正常にインポートできる
- Tailwindのユーティリティクラスが動作する

## ラベル
setup, ui, Phase-1"

# Issue 3
"$GH" issue create --title "Prisma ORM のセットアップとスキーマ定義" --body "## 概要
Prismaをセットアップし、ER図に基づいてデータベーススキーマを定義する。

## タスク
- [ ] Prismaのインストール
- [ ] Prisma初期化
- [ ] schema.prisma にER図のスキーマを実装（User、DiscordServer、DailyReport、MonitoringRecord、Comment）
- [ ] マイグレーションファイル作成
- [ ] Prisma Client生成

## 受け入れ条件
- npx prisma db push でスキーマがDBに反映される
- npx prisma studio でデータベースが確認できる
- リレーションが正しく設定されている

## ラベル
setup, database, Phase-1"

# Issue 4
"$GH" issue create --title "Vitest テストフレームワークのセットアップ" --body "## 概要
Vitestをセットアップし、テスト環境を構築する。

## タスク
- [ ] Vitestのインストール
- [ ] vitest.config.ts 設定
- [ ] テスト用のヘルパー関数作成
- [ ] サンプルテストを作成して動作確認

## 受け入れ条件
- npm run test でテストが実行される
- Next.jsのコンポーネントとAPIルートがテスト可能

## ラベル
setup, testing, Phase-1"

# Issue 5
"$GH" issue create --title "環境変数の設定とシークレット管理" --body "## 概要
開発・本番環境の環境変数を設定する。

## タスク
- [ ] .env.example ファイル作成
- [ ] .env.local ファイル作成（gitignore）
- [ ] 環境変数の型定義（env.ts）
- [ ] 環境変数バリデーション（Zod）

## 必要な環境変数
- DATABASE_URL
- JWT_SECRET
- NEXT_PUBLIC_API_URL

## 受け入れ条件
- 環境変数が正しく読み込まれる
- 型安全に環境変数にアクセスできる

## ラベル
setup, security, Phase-1"

# Issue 6
"$GH" issue create --title "JWT認証の実装準備" --body "## 概要
JWT（JSON Web Token）を使った認証機能の基盤を作成する。

## タスク
- [ ] jsonwebtoken または jose ライブラリのインストール
- [ ] bcryptjs のインストール（パスワードハッシュ化）
- [ ] JWT生成・検証関数の実装（lib/auth.ts）
- [ ] ミドルウェアの実装（認証チェック）

## 受け入れ条件
- JWTトークンが生成・検証できる
- パスワードがハッシュ化できる

## ラベル
feature, auth, Phase-2"

# Issue 7
"$GH" issue create --title "ログインAPI（POST /api/auth/login）の実装" --body "## 概要
ユーザーログイン機能を実装する。

## タスク
- [ ] app/api/auth/login/route.ts 作成
- [ ] リクエストボディのZodスキーマ定義
- [ ] メール・パスワード検証ロジック
- [ ] JWTトークン発行
- [ ] エラーハンドリング（401 Unauthorized）
- [ ] APIテスト作成

## 受け入れ条件
- 正しい認証情報でトークンが取得できる
- 誤った認証情報で401エラーが返る
- APIテストが全て通る

## ラベル
feature, auth, api, Phase-2"

# Issue 8
"$GH" issue create --title "ユーザー情報取得API（GET /api/auth/me）の実装" --body "## 概要
ログイン中のユーザー情報を取得するAPIを実装する。

## タスク
- [ ] app/api/auth/me/route.ts 作成
- [ ] Authorizationヘッダーからトークン取得
- [ ] トークン検証
- [ ] ユーザー情報取得（Prisma）
- [ ] APIテスト作成

## 受け入れ条件
- 有効なトークンでユーザー情報が取得できる
- 無効なトークンで401エラーが返る

## ラベル
feature, auth, api, Phase-2"

# Issue 9
"$GH" issue create --title "ログアウトAPI（POST /api/auth/logout）の実装" --body "## 概要
ログアウト機能を実装する。

## タスク
- [ ] app/api/auth/logout/route.ts 作成
- [ ] クライアント側のトークン削除処理
- [ ] APIテスト作成

## 受け入れ条件
- ログアウトが成功する
- トークンが無効化される

## ラベル
feature, auth, api, Phase-2"

# Issue 10
"$GH" issue create --title "ログイン画面（SCR-001）の実装" --body "## 概要
ログイン画面UIを実装する。

## タスク
- [ ] app/login/page.tsx 作成
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

## ラベル
feature, auth, ui, Phase-2"

echo ""
echo "✅ 10個のIssueを作成しました！"
echo "続きを作成する場合は create-issues-part2.sh を実行してください"
