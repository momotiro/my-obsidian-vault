# Discord監視日報システム - デプロイ手順書

## 📋 前提条件

### 必要なツール
- [ ] Google Cloud CLI (gcloud) インストール済み
- [ ] Docker Desktop インストール済み
- [ ] 本番用データベース（PostgreSQL）準備済み
- [ ] Google Cloud プロジェクト作成済み

---

## 🔧 1. 環境変数の準備

### 本番環境用の環境変数を設定

以下の環境変数を準備してください：

```bash
# データベース接続URL（本番環境のPostgreSQL）
export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# JWT署名用シークレット（32文字以上のランダム文字列）
export JWT_SECRET="your-secure-random-secret-key-min-32-characters"

# APIのベースURL（デプロイ後のCloud Run URL）
export NEXT_PUBLIC_API_URL="https://discord-monitor-report-xxx.run.app"
```

### JWT_SECRETの生成方法

```bash
# Linuxの場合
openssl rand -base64 32

# Windowsの場合（PowerShell）
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🗄️ 2. データベースのセットアップ

### 本番用PostgreSQLデータベースの準備

#### オプション1: Google Cloud SQL (推奨)

```bash
# Cloud SQL Postgresインスタンスを作成
gcloud sql instances create discord-monitor-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-northeast1

# データベースを作成
gcloud sql databases create discord_monitor \
  --instance=discord-monitor-db

# ユーザーを作成
gcloud sql users create dbuser \
  --instance=discord-monitor-db \
  --password=<strong-password>

# 接続情報を取得
gcloud sql instances describe discord-monitor-db
```

#### オプション2: Supabase (無料枠あり)

1. https://supabase.com にアクセス
2. 新しいプロジェクトを作成
3. Settings → Database → Connection stringを取得
4. `DATABASE_URL`として使用

#### オプション3: Neon (無料枠あり)

1. https://neon.tech にアクセス
2. 新しいプロジェクトを作成
3. Connection stringを取得
4. `DATABASE_URL`として使用

### Prismaマイグレーションの実行

```bash
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report"

# 本番DBのURLを設定
export DATABASE_URL="postgresql://..."

# マイグレーション実行
npx prisma migrate deploy

# シードデータ投入（初回のみ）
npx prisma db seed
```

---

## 🐳 3. Google Cloud の設定

### Google Cloud CLIのインストール

Windowsの場合：
```powershell
# Google Cloud CLI インストーラーをダウンロード
# https://cloud.google.com/sdk/docs/install

# インストール後、初期化
gcloud init
```

### プロジェクトの設定

```bash
# プロジェクトIDを設定
gcloud config set project discord-management-482906

# 認証
gcloud auth login

# Docker認証設定
gcloud auth configure-docker
```

---

## 🚀 4. デプロイ実行

### 方法1: Makefileを使用（推奨）

```bash
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report"

# 環境変数を設定
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret-key"
export NEXT_PUBLIC_API_URL="https://discord-monitor-report-xxx.run.app"

# デプロイ実行
make deploy
```

### 方法2: 手動デプロイ

```bash
# 1. Dockerイメージをビルド
docker build -t gcr.io/discord-management-482906/discord-monitor-report:latest .

# 2. イメージをプッシュ
docker push gcr.io/discord-management-482906/discord-monitor-report:latest

# 3. Cloud Runにデプロイ
gcloud run deploy discord-monitor-report \
  --image gcr.io/discord-management-482906/discord-monitor-report:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="${DATABASE_URL}" \
  --set-env-vars JWT_SECRET="${JWT_SECRET}" \
  --set-env-vars NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60
```

---

## ✅ 5. デプロイ後の確認

### デプロイURLの取得

```bash
make deploy-url
```

または

```bash
gcloud run services describe discord-monitor-report \
  --region asia-northeast1 \
  --format 'value(status.url)'
```

### ヘルスチェック

```bash
# URLを取得
DEPLOY_URL=$(gcloud run services describe discord-monitor-report \
  --region asia-northeast1 \
  --format 'value(status.url)')

# APIが正常に動作しているか確認
curl ${DEPLOY_URL}/api/health
```

### ログの確認

```bash
# 最新50件のログを表示
make logs

# ログをリアルタイムで監視
make logs-tail
```

---

## 🧪 6. 動作テスト

### ログインAPIのテスト

```bash
DEPLOY_URL="https://your-service-url.run.app"

curl -X POST ${DEPLOY_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@example.com",
    "password": "password123"
  }'
```

成功すると以下のようなレスポンスが返ります：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "佐藤太郎",
      "email": "staff@example.com",
      "role": "STAFF"
    }
  }
}
```

### 日報一覧APIのテスト

```bash
# 上記で取得したトークンを使用
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET "${DEPLOY_URL}/api/reports" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## 🔄 7. 更新デプロイ

コードを更新した場合：

```bash
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report"

# 1. コードをコミット
git add .
git commit -m "Update: ..."
git push

# 2. 再デプロイ
make deploy
```

---

## 🔙 8. ロールバック

問題が発生した場合、前のバージョンに戻せます：

```bash
make rollback
```

または

```bash
gcloud run services update-traffic discord-monitor-report \
  --region asia-northeast1 \
  --to-revisions LATEST=0
```

---

## 🗑️ 9. サービスの削除

不要になった場合：

```bash
make delete
```

---

## 📊 10. 本番環境の監視

### Cloud Runコンソール

https://console.cloud.google.com/run

- リクエスト数
- レスポンスタイム
- エラー率
- メモリ使用量

### ログ確認

```bash
# リアルタイムログ
make logs-tail

# 最新ログ
make logs
```

---

## 🔐 11. セキュリティ設定

### 環境変数の保護

本番環境では環境変数をGoogle Cloud Secret Managerで管理することを推奨：

```bash
# シークレットを作成
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-

# Cloud Runサービスにシークレットへのアクセス権を付与
gcloud run services update discord-monitor-report \
  --update-secrets=DATABASE_URL=database-url:latest \
  --update-secrets=JWT_SECRET=jwt-secret:latest \
  --region asia-northeast1
```

---

## 📝 トラブルシューティング

### デプロイが失敗する場合

1. **Docker buildエラー**
   ```bash
   # ローカルでビルドテスト
   docker build -t test-image .
   ```

2. **環境変数エラー**
   ```bash
   # 環境変数が正しく設定されているか確認
   gcloud run services describe discord-monitor-report \
     --region asia-northeast1 \
     --format yaml
   ```

3. **データベース接続エラー**
   ```bash
   # DATABASE_URLが正しいか確認
   echo $DATABASE_URL

   # Prismaで接続テスト
   npx prisma db execute --stdin < /dev/null
   ```

---

## 📞 サポート

問題が解決しない場合：
1. ログを確認: `make logs`
2. Cloud Runコンソールを確認
3. GitHub Issuesに報告

---

**デプロイ準備完了！** 🚀
