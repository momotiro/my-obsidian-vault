# Discord監視日報システム - 自動デプロイスクリプト (PowerShell)

Write-Host "=== Discord Monitor Report - Automated Deployment ===" -ForegroundColor Cyan

# 変数設定
$PROJECT_ID = "discord-management-482906"
$SERVICE_NAME = "discord-monitor-report"
$REGION = "asia-northeast1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Step 1: 環境変数チェック
Write-Host "`n[1/6] Checking environment variables..." -ForegroundColor Yellow

if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL is not set!" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL first:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL="postgresql://..."' -ForegroundColor Gray
    Write-Host "`nFor quick setup, visit: https://neon.tech" -ForegroundColor Cyan
    exit 1
}

if (-not $env:JWT_SECRET) {
    Write-Host "WARNING: JWT_SECRET not set. Generating one..." -ForegroundColor Yellow
    $env:JWT_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    Write-Host "Generated JWT_SECRET: $env:JWT_SECRET" -ForegroundColor Green
}

if (-not $env:NEXT_PUBLIC_API_URL) {
    $env:NEXT_PUBLIC_API_URL = "https://$SERVICE_NAME-xxx.run.app"
    Write-Host "Using placeholder NEXT_PUBLIC_API_URL: $env:NEXT_PUBLIC_API_URL" -ForegroundColor Yellow
}

Write-Host "✓ Environment variables configured" -ForegroundColor Green

# Step 2: Docker Build
Write-Host "`n[2/6] Building Docker image..." -ForegroundColor Yellow
docker build -t ${IMAGE_NAME}:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green

# Step 3: Docker Push
Write-Host "`n[3/6] Pushing Docker image to GCR..." -ForegroundColor Yellow

# タグ付け（タイムスタンプ）
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:$timestamp

# プッシュ
docker push ${IMAGE_NAME}:latest
docker push ${IMAGE_NAME}:$timestamp

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image pushed successfully" -ForegroundColor Green

# Step 4: gcloudパスを取得
Write-Host "`n[4/6] Locating gcloud command..." -ForegroundColor Yellow

$gcloudPath = $null
$possiblePaths = @(
    "C:\Users\$env:USERNAME\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $gcloudPath = $path
        break
    }
}

if (-not $gcloudPath) {
    # PATHから検索
    $gcloudPath = (Get-Command gcloud -ErrorAction SilentlyContinue).Source
}

if (-not $gcloudPath) {
    Write-Host "ERROR: gcloud command not found!" -ForegroundColor Red
    Write-Host "Please ensure Google Cloud SDK is installed and in PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found gcloud at: $gcloudPath" -ForegroundColor Green

# Step 5: Cloud Runにデプロイ
Write-Host "`n[5/6] Deploying to Cloud Run..." -ForegroundColor Yellow

& $gcloudPath run deploy $SERVICE_NAME `
    --image ${IMAGE_NAME}:latest `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars "DATABASE_URL=$env:DATABASE_URL" `
    --set-env-vars "JWT_SECRET=$env:JWT_SECRET" `
    --set-env-vars "NEXT_PUBLIC_API_URL=$env:NEXT_PUBLIC_API_URL" `
    --min-instances 0 `
    --max-instances 10 `
    --memory 512Mi `
    --cpu 1 `
    --timeout 60 `
    --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cloud Run deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Deployed to Cloud Run successfully" -ForegroundColor Green

# Step 6: デプロイURLを取得
Write-Host "`n[6/6] Getting deployment URL..." -ForegroundColor Yellow

$deployUrl = & $gcloudPath run services describe $SERVICE_NAME `
    --region $REGION `
    --format 'value(status.url)' `
    --project $PROJECT_ID

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment completed successfully! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service URL: $deployUrl" -ForegroundColor White
Write-Host "`nTest the API:" -ForegroundColor Yellow
Write-Host "  curl $deployUrl/api/health" -ForegroundColor Gray
Write-Host "`nView logs:" -ForegroundColor Yellow
Write-Host "  gcloud run services logs read $SERVICE_NAME --region $REGION" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan
