# Slack Task Sync Bot

Slackに投稿したメッセージを📝絵文字でリアクションするだけで、Obsidianのデイリーノートにタスクとして自動追加します。

**リアルタイム同期対応！絵文字リアクション後、数秒でObsidianに反映されます。**

## 特徴

- ⚡ **リアルタイム同期**: 絵文字リアクション後、即座にObsidianに追加（Socket Mode）
- 🏷️ **柔軟なタグ設定**: Slackメッセージに`#タグ名`を含めると自動的にタグ付け
- 🔄 **バッチ同期モード**: 定期実行で過去のタスクをまとめて同期も可能
- 📝 **Slackリンク**: 各タスクに元メッセージへのパーマリンク付き

## セットアップ

### 1. Slack Appの作成

1. https://api.slack.com/apps にアクセス
2. "Create New App" → "From scratch"
3. App名を入力（例：Task Sync Bot）
4. ワークスペースを選択

### 2. Socket Modeの有効化（リアルタイム同期用）

1. "Socket Mode"ページで"Enable Socket Mode"をON
2. App-Level Tokenを作成（スコープ: `connections:write`）
3. トークン（xapp-で始まる）を保存

### 3. Event Subscriptionsの設定

1. "Event Subscriptions"ページで"Enable Events"をON
2. "Subscribe to bot events"に以下を追加：
   - `reaction_added`

### 4. Bot権限の設定

"OAuth & Permissions" ページで以下のスコープを追加：
- `channels:history` - 公開チャンネルのメッセージ履歴を読む
- `channels:read` - 公開チャンネル情報を読む
- `groups:history` - プライベートチャンネルのメッセージ履歴を読む
- `groups:read` - プライベートチャンネル情報を読む
- `reactions:read` - リアクション情報を読む

### 5. Botをワークスペースにインストール

1. "Install to Workspace"をクリック
2. "Bot User OAuth Token"（xoxb-で始まる）をコピー

### 6. Botをチャンネルに招待

監視したいチャンネルで `/invite @Task Sync Bot` を実行

### 7. 環境設定

```bash
cd slack-task-sync
pip install -r requirements.txt
cp .env.example .env
```

`.env`ファイルを編集：
```
SLACK_BOT_TOKEN=xoxb-your-actual-token
SLACK_APP_TOKEN=xapp-your-app-token
DEFAULT_TAGS=TGS
```

## 使い方

### リアルタイム同期（推奨）

```bash
python slack_task_bot.py --realtime
```

起動後、Slackでメッセージに📝絵文字でリアクションすると、数秒以内にObsidianの`tasks.md`に追加されます。

**タスクファイル構造:**
```markdown
# タスク管理

## 2025-10-19
- [ ] データベース設計書を作成する #TGS #緊急 [Slack](リンク)
- [ ] ミーティング準備 #TGS [Slack](リンク)

## 2025-10-18
- [ ] コードレビュー #開発 [Slack](リンク)
- [x] 資料作成 #TGS [Slack](リンク)
```

すべてのタスクが1つのファイル（`tasks.md`）に集約され、日付セクションで整理されます。新しい日付は上に追加されます。

**タグの指定方法:**

1. **Slackメッセージ内にタグを記載**（推奨）
   ```
   データベース設計書を作成する #TGS #緊急
   ```
   → `- [ ] データベース設計書を作成する #TGS #緊急 [Slack](リンク)`

2. **デフォルトタグを使用**
   ```
   コマンドライン: python slack_task_bot.py --realtime --tags TGS 重要
   または .env: DEFAULT_TAGS=TGS,重要
   ```

3. **タグなし**
   ```
   Slackメッセージにタグなし、デフォルトタグも未設定の場合
   ```
   → `- [ ] メッセージ内容 [Slack](リンク)`

### バッチ同期モード

定期実行やまとめて同期したい場合：

```bash
# デフォルトタグを指定
python slack_task_bot.py --tags TGS 緊急

# 絵文字を変更（✅を使用）
python slack_task_bot.py --emoji white_check_mark
```

## 定期実行（バッチモード）

### Windowsタスクスケジューラ

1. タスクスケジューラを開く
2. "基本タスクの作成"
3. トリガー：5分ごと
4. 操作：プログラムの開始
   - プログラム：`python`
   - 引数：`slack_task_bot.py --tags TGS`
   - 開始：`c:\Users\80036\Documents\Obsidian Vault\slack-task-sync`

### cronジョブ（Linux/Mac）

```bash
# 5分ごとに実行
*/5 * * * * cd /path/to/slack-task-sync && python slack_task_bot.py --tags TGS
```

## コマンドラインオプション

```bash
python slack_task_bot.py [オプション]

--realtime              リアルタイム同期モード（常駐）
--tags TAG1 TAG2 ...    デフォルトタグ（複数指定可）
--emoji EMOJI_NAME      リアクション絵文字（デフォルト: memo）
```

## トラブルシューティング

### リアルタイム同期が動かない

- Socket Modeが有効化されているか確認
- `SLACK_APP_TOKEN`が正しく設定されているか確認
- Event Subscriptionsで`reaction_added`が登録されているか確認

### タスクが追加されない

- Botがチャンネルに招待されているか確認（`/invite @Bot名`）
- Bot権限が正しく設定されているか確認
