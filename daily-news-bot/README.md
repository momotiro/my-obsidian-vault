# Daily News Bot

毎日有益な日本語記事を自動収集してSlackに配信

## 概要

- **配信時間**: 毎日 日本時間 朝6時
- **配信先**: Slack `#news` チャンネル
- **記事数**: 5つ/日（すべて日本語記事）
- **メンション**: @塩川 太郎 (User ID: U05A1BUDW02)

## 記事選定条件

- **テーマ**: マーケティング（コミュニティ、SNS、インフルエンサー）、AI、デジタルマーケティング
- **ソース**:
  - 日経クロストレンド（最優先）
  - MarkeZine（マーケジン）
  - ITmedia マーケティング
  - 日経ビジネス
  - CNET Japan
- **言語**: 日本語のみ（🇯🇵）
- **鮮度**: 過去3日以内
- **除外**: 有料記事、プレスリリース、イベント告知、新商品発売告知

## 学習機能

記事に👍👎リアクションをつけると、好みを学習して次回以降の選定に反映されます。

**ポジティブリアクション**: 👍 ❤️ 🔥 🤩 👀 💯
**ネガティブリアクション**: 👎 😞

学習データに基づき、記事のソースやタグごとにスコアリングされます。

## セットアップ

### 1. Slack Bot権限

https://api.slack.com/apps でアプリを開き、以下の権限を追加：

- `chat:write` - メッセージ投稿
- `chat:write.public` - パブリックチャンネル投稿
- `reactions:write` - リアクション追加
- `channels:history` - チャンネル履歴取得（学習機能用）

**Reinstall to Workspace** で権限を反映してください。

### 2. GitHub Secrets

リポジトリの Settings → Secrets and variables → Actions で設定：

- `SLACK_BOT_TOKEN`: Slack Bot Token (xoxb-...)

**Note**: NEWS_API_KEYは不要です（RSSフィードのみ使用）

### 3. Botを#newsチャンネルに招待

Slackで: `/invite @Daily News Bot`

## 手動実行

GitHub Actions タブから「Daily News Collector」→「Run workflow」

## ファイル構成

```
daily-news-bot/
├── news_collector.py      # メインスクリプト（RSS収集・Slack投稿）
├── reaction_learner.py    # 学習スクリプト（リアクション分析）
├── requirements.txt       # 依存関係（requests, feedparser）
├── sent_articles.json     # 既読記事管理（最新1000件）
├── learning_data.json     # 学習データ（好みのソース・タグ）
└── README.md

.github/workflows/
└── daily-news.yml        # 自動実行設定（毎朝6時）
```

## 処理フロー

### GitHub Actions（毎日6時実行）

1. **Learn from reactions** (`reaction_learner.py`)
   - 過去7日間のSlackメッセージを取得
   - daily_news_articleタイプのメッセージのリアクションを分析
   - ソース・タグごとにスコアを更新
   - `learning_data.json` を更新

2. **Collect and send news** (`news_collector.py`)
   - 各RSSフィードから記事を収集（日経クロストレンド、MarkeZine等）
   - 過去3日以内 & 既読でない記事をフィルタリング
   - 有料記事・プレスリリース等を除外
   - 学習データに基づきスコアリング
   - 上位5件を選定
   - Slackに投稿（ヘッダー + 個別記事5件）
   - 各記事に👍👎リアクションを自動追加
   - `sent_articles.json` を更新

3. **Commit and push updates**
   - 更新された `*.json` ファイルをGitHubにコミット

## トラブルシューティング

### リアクションが追加されない
- Slack Botに `reactions:write` 権限があるか確認
- Botを再インストール

### 学習機能が動かない
- Slack Botに `channels:history` 権限があるか確認
- Botを再インストール

### 記事が見つからない
- RSSフィードが正常に取得できているか確認
- GitHub Actionsのログを確認
- 除外キーワードが多すぎる可能性

### 日経クロストレンドが含まれない
- 日経クロストレンドのRSSフィードが正常に動作しているか確認
- フィードURL:
  - https://xtrend.nikkei.com/rss/atcl/new.rdf
  - https://xtrend.nikkei.com/rss/atcl/feature.rdf

## メッセージ形式

### ヘッダー（メンション付き）
```
📰 今日のおすすめ記事 (2025-10-19) @塩川 太郎
良かった記事には👍リアクションをつけてください！
```

### 個別記事（5件）
```
1️⃣ 記事タイトル
🇯🇵 🔗 https://example.com/article
📝 記事の要約（200文字以内）
🏷️ #マーケティング #AI | 📰 日経クロストレンド
```

## 技術仕様

- **言語**: Python 3.11
- **ライブラリ**:
  - `requests` - HTTP通信
  - `feedparser` - RSS解析
- **実行環境**: GitHub Actions (Ubuntu)
- **スケジュール**: cron `0 21 * * *` (21:00 UTC = 06:00 JST)
