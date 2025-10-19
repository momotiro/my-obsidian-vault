# Daily News Bot

毎日有益なマーケティング・AI記事を自動収集してSlackに配信

## 概要

- **配信時間**: 毎日 日本時間 朝6時
- **配信先**: Slack `#news` チャンネル
- **記事数**: 5つ/日（日本語3以上、英語2以下）

## 記事選定条件

- **テーマ**: マーケティング（コミュニティ、SNS、インフルエンサー）、AI
- **ソース**: 日経クロストレンド（最優先）+ マーケジン、ITmedia等
- **言語**: 日本語優先（60%以上）
- **鮮度**: 過去24〜48時間
- **除外**: 有料記事、プレスリリース、イベント告知

## 学習機能

記事に👍👎リアクションをつけると、好みを学習して次回以降の選定に反映されます。

## セットアップ

### 1. Slack Bot権限

https://api.slack.com/apps でアプリを開き、以下の権限を追加：

- `chat:write` - メッセージ投稿
- `chat:write.public` - パブリックチャンネル投稿
- `reactions:write` - リアクション追加

**Reinstall to Workspace** で権限を反映してください。

### 2. GitHub Secrets

リポジトリの Settings → Secrets and variables → Actions で設定：

- `SLACK_BOT_TOKEN`: Slack Bot Token (xoxb-...)
- `NEWS_API_KEY`: News API Key (https://newsapi.org/)

### 3. Botを#newsチャンネルに招待

Slackで: `/invite @Daily News Bot`

## 手動実行

GitHub Actions タブから「Daily News Collector」→「Run workflow」

## ファイル構成

```
daily-news-bot/
├── news_collector.py      # メインスクリプト
├── reaction_learner.py    # 学習スクリプト
├── requirements.txt       # 依存関係
├── sent_articles.json     # 既読管理
├── learning_data.json     # 学習データ
└── README.md

.github/workflows/
└── daily-news.yml        # 自動実行設定
```

## トラブルシューティング

### リアクションが追加されない
- Slack Botに `reactions:write` 権限があるか確認
- Botを再インストール

### 記事が見つからない
- News API Keyが正しく設定されているか確認
- 無料プランは100リクエスト/日の制限あり

### 日経クロストレンドが含まれない
- RSSフィードが正常に取得できているか確認
- GitHub Actionsのログを確認
