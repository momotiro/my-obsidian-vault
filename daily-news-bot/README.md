# Daily News Bot

毎日有益な記事を自動収集してSlackに配信するシステム

## 概要

- **配信時間**: 毎日 日本時間 朝6時
- **配信先**: Slack `#news` チャンネル
- **記事数**: 5つ/日（日本語3以上、英語2以下）

## 記事選定条件

- **テーマ**: マーケティング（コミュニティ、SNS、インフルエンサー）、AI
- **ソース**: 日経クロストレンド + その他有益メディア
- **言語**: 日本語・英語両方（**日本語3/5以上**）
- **鮮度**: 過去24〜48時間以内
- **重複**: 一度送った記事は除外

## 学習機能

👍（`:thumbsup:`）や❤️（`:heart:`）などのリアクションをつけることで、記事の好みを学習します。

- **ポジティブリアクション**: `thumbsup`, `heart`, `fire`, `star-struck`, `eyes`, `100`
- **ネガティブリアクション**: `thumbsdown`, `disappointed`

リアクションをつけた記事のソースやタグを記憶し、次回以降の記事選定に反映されます。

## セットアップ

### 1. Slack Bot権限の追加

Slack Appの設定で以下の権限を追加してください：

1. https://api.slack.com/apps であなたのアプリを開く
2. **OAuth & Permissions** → **Bot Token Scopes** に以下を追加：
   - `chat:write` - メッセージを投稿
   - `chat:write.public` - パブリックチャンネルに投稿
   - `reactions:write` - リアクションを追加（**新規追加**）
3. **Reinstall to Workspace** をクリックして権限を再適用

### 2. 必要な環境変数

GitHub Secretsに以下を設定：

- `SLACK_BOT_TOKEN`: Slack Bot Token (xoxb-...)
- `NEWS_API_KEY`: News API Key (https://newsapi.org/ で取得)

### 3. ローカルテスト

```bash
cd daily-news-bot

# 仮想環境作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
export SLACK_BOT_TOKEN="xoxb-..."
export NEWS_API_KEY="..."
export GITHUB_TOKEN="..."  # GitHub Personal Access Token
export GITHUB_REPOSITORY="username/repo"

# 実行
python news_collector.py
```

### 4. GitHub Actionsで自動実行

`.github/workflows/daily-news.yml` が毎朝6時（JST）に自動実行されます。

## 記事ソースの追加

### 日経クロストレンドの実装

`news_collector.py` の `search_nikkei_xtrend()` 関数を実装してください。

実装方法：
1. 日経クロストレンドのRSS/APIを確認
2. または公式APIがあれば利用
3. スクレイピングする場合は `robots.txt` を確認

### 他のソースの追加

`search_web_articles()` 関数内で追加のAPIを呼び出すか、新しい関数を作成してください。

## ファイル構成

```
daily-news-bot/
├── news_collector.py      # メインスクリプト
├── requirements.txt       # Python依存関係
├── sent_articles.json     # 既読記事リスト（自動生成）
└── README.md             # このファイル
```

## トラブルシューティング

### 記事が見つからない場合

- News API Keyが正しく設定されているか確認
- キーワードを調整（`news_collector.py` 内の `keywords` リスト）
- 検索期間を延長（`days` パラメータを増やす）

### Slack投稿が失敗する場合

- Bot Tokenが正しいか確認
- Botが `#news` チャンネルに招待されているか確認
- Bot権限に `chat:write` が含まれているか確認

## ライセンス

Private Use
