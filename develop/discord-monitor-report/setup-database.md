# データベースセットアップ - 簡易手順

## 最も簡単な方法: Neon（無料・2分で完了）

### 1. Neonアカウント作成

ブラウザで以下のURLを開く：
```
https://neon.tech/
```

### 2. プロジェクト作成

1. "Sign up"をクリック → Googleアカウントでサインイン
2. "Create a project"をクリック
3. Project name: `discord-monitor-report`
4. Region: `AWS / Tokyo (ap-northeast-1)` を選択
5. "Create project"をクリック

### 3. 接続文字列を取得

作成完了後、自動的に表示される接続文字列（Connection String）をコピー：

```
postgresql://username:password@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require
```

### 4. 環境変数を設定

PowerShellで以下を実行：

```powershell
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report"

# DATABASE_URLを設定（上記でコピーした接続文字列に置き換える）
$env:DATABASE_URL="postgresql://username:password@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require"

# JWT_SECRETを設定
$env:JWT_SECRET="8wnI+arh9LmWDUt5zXVYWcJxqNnyeq9TOvA5tM3JZB0="

# NEXT_PUBLIC_API_URLは後で設定（デプロイ後に判明）
$env:NEXT_PUBLIC_API_URL="https://discord-monitor-report-xxx.run.app"
```

### 5. Prismaマイグレーション実行

```powershell
# Prisma Clientを生成
npx prisma generate

# マイグレーションを実行
npx prisma migrate deploy

# シードデータを投入
npx prisma db seed
```

### 6. デプロイ実行

環境変数が設定された状態で：

```powershell
# Dockerイメージをビルド＆プッシュ
docker build -t gcr.io/discord-management-482906/discord-monitor-report:latest .
docker push gcr.io/discord-management-482906/discord-monitor-report:latest

# Cloud Runにデプロイ
gcloud run deploy discord-monitor-report `
  --image gcr.io/discord-management-482906/discord-monitor-report:latest `
  --region asia-northeast1 `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars DATABASE_URL="$env:DATABASE_URL" `
  --set-env-vars JWT_SECRET="$env:JWT_SECRET" `
  --set-env-vars NEXT_PUBLIC_API_URL="https://discord-monitor-report-xxx.run.app" `
  --min-instances 0 `
  --max-instances 10 `
  --memory 512Mi `
  --cpu 1 `
  --timeout 60
```

---

## 代替方法: Supabase（無料・GUI操作）

1. https://supabase.com にアクセス
2. "Start your project"をクリック
3. Googleアカウントでサインイン
4. "New Project"をクリック
5. 以下を入力：
   - Name: `discord-monitor-report`
   - Database Password: 強力なパスワード（メモ必須）
   - Region: `Northeast Asia (Tokyo)`
6. "Create new project"をクリック（約2分待つ）
7. Project Settings → Database → Connection string → URI をコピー
8. 上記の手順4以降を実行

---

## トラブルシューティング

### gcloudコマンドが見つからない場合

PowerShellを**再起動**してから再度実行：

```powershell
# gcloudのパスを確認
where.exe gcloud

# 表示されない場合は、明示的にパスを指定
& "C:\Users\80036\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" --version
```

### Dockerコマンドが見つからない場合

Docker Desktopが起動しているか確認：

```powershell
docker --version
```

---

**次のステップ:**
1. Neonでデータベースを作成（2分）
2. 接続文字列を取得
3. 環境変数を設定
4. マイグレーション実行
5. デプロイ実行

準備完了後、デプロイコマンドを実行してください 🚀
