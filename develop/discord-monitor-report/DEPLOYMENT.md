# Discord監視日報システム - デプロイガイド

## 概要

このドキュメントは、Discord監視日報システムの本番環境へのデプロイ手順を記載しています。

## 前提条件

- Google Cloud Project の作成
- Google Cloud CLI (`gcloud`) のインストール
- Docker Desktop のインストール  
- Neon PostgreSQL アカウント（または任意のPostgreSQL）
- Node.js 20.x 以上

## 環境変数

### 必須環境変数

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
JWT_SECRET="your-secret-key-at-least-32-characters-long"
NEXT_PUBLIC_API_URL="https://your-app-url.run.app"
```

### 環境変数の生成

**JWT_SECRET の生成:**
```bash
openssl rand -base64 32
```

## デプロイ手順

### 1. データベースのセットアップ

#### Neon PostgreSQL を使用する場合

1. [Neon Console](https://console.neon.tech/) にアクセス
2. 新しいプロジェクトを作成
3. リージョンを選択（推奨: Asia Pacific）
4. 接続文字列をコピー

#### マイグレーションの実行

```bash
# プロジェクトディレクトリに移動
cd develop/discord-monitor-report

# .env.production ファイルを作成
cp .env.example .env.production

# DATABASE_URL を設定
# .env.production を編集

# Prisma クライアント生成
npm run db:generate

# マイグレーション実行
npx prisma migrate deploy
```

### 2. 初期データの投入

```bash
# 本番用シードデータを投入
npx tsx prisma/seed-production.ts
```

**作成されるユーザー:**
- Staff: `staff@example.com` / `staff123`
- Manager: `manager@example.com` / `manager123`

**作成されるサーバー:**
- メインコミュニティ（Active）
- サブコミュニティ（Active）
- テストサーバー（Inactive）

### 3. Google Cloud の設定

#### プロジェクト初期化

```bash
# gcloud CLI 初期化
gcloud init

# プロジェクト ID を設定
gcloud config set project YOUR_PROJECT_ID

# 必要な API を有効化
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

#### Artifact Registry リポジトリ作成

```bash
gcloud artifacts repositories create discord-monitor-report \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Discord Monitor Report Docker Repository"
```

#### Docker 認証設定

```bash
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

### 4. Docker イメージのビルドとプッシュ

```bash
# プロジェクトディレクトリで実行
cd develop/discord-monitor-report

# .next ディレクトリをクリーンアップ
rm -rf .next

# Docker イメージをビルド
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/discord-monitor-report/app:latest .

# Artifact Registry にログイン（Windows PowerShell）
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://asia-northeast1-docker.pkg.dev

# イメージをプッシュ
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/discord-monitor-report/app:latest
```

### 5. Cloud Run へのデプロイ

```bash
gcloud run deploy discord-monitor-report \
  --image asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/discord-monitor-report/app:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL='YOUR_DATABASE_URL',JWT_SECRET='YOUR_JWT_SECRET',NEXT_PUBLIC_API_URL='https://your-service-url.run.app'
```

**注意:** `NEXT_PUBLIC_API_URL` は初回デプロイ後に取得できる Service URL を設定してください。

### 6. デプロイ後の確認

```bash
# デプロイされた URL を確認
gcloud run services describe discord-monitor-report \
  --region asia-northeast1 \
  --format 'value(status.url)'

# ヘルスチェック
curl -I https://your-service-url.run.app/
```

## 更新デプロイ

コードを更新した後の再デプロイ手順:

```bash
# 1. 変更をコミット
git add .
git commit -m "Update: your changes"
git push

# 2. Docker イメージを再ビルド
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/discord-monitor-report/app:latest .

# 3. プッシュ
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/discord-monitor-report/app:latest

# 4. Cloud Run に再デプロイ（環境変数は保持されます）
gcloud run deploy discord-monitor-report \
  --image asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/discord-monitor-report/app:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated
```

## トラブルシューティング

### TypeScript コンパイルエラー

```bash
# ローカルで型チェック
npx tsc --noEmit

# ESLint チェック
npm run lint
```

### データベース接続エラー

```bash
# Prisma Studio でデータベース確認
npx prisma studio

# 接続テスト
npx prisma db pull
```

### Docker ビルドエラー

```bash
# キャッシュをクリアして再ビルド
docker build --no-cache -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/discord-monitor-report/app:latest .
```

### Cloud Run ログ確認

```bash
# サービスログを表示
gcloud run services logs read discord-monitor-report \
  --region asia-northeast1 \
  --limit 100
```

## セキュリティ

### 環境変数の管理

- **絶対に Git にコミットしない:** `.env`, `.env.production` は `.gitignore` に含まれています
- **JWT_SECRET は強力なもの:** 最低32文字のランダム文字列を使用
- **DATABASE_URL は暗号化:** Cloud Run の環境変数は自動的に暗号化されます

### 本番環境の保護

- Cloud Run の IAM ポリシーを適切に設定
- データベースのIPホワイトリストを設定（可能な場合）
- 定期的なセキュリティアップデート

## モニタリング

### Cloud Run メトリクス

Google Cloud Console > Cloud Run > discord-monitor-report で以下を確認:
- リクエスト数
- レイテンシ
- エラー率
- CPU/メモリ使用率

### ログ確認

```bash
# エラーログのみ表示
gcloud run services logs read discord-monitor-report \
  --region asia-northeast1 \
  --filter="severity>=ERROR"
```

## バックアップ

### データベースバックアップ

Neon PostgreSQL の場合、自動バックアップが有効です。

手動バックアップ:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## 本番環境情報

**現在のデプロイ:**
- **Service URL:** https://discord-monitor-report-528834221704.asia-northeast1.run.app
- **Region:** asia-northeast1
- **Database:** Neon PostgreSQL (Singapore)
- **Container Registry:** Artifact Registry (asia-northeast1)

## サポート

問題が発生した場合は、以下を確認してください:
1. プロジェクトの CLAUDE.md
2. 各フェーズのドキュメント（画面定義書.md、API仕様書.md、テスト仕様書.md）
3. Cloud Run ログ
