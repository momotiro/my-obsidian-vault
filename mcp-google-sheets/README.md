# MCP Google Sheets Server

Google SheetsとClaude Code/Desktopを連携させるためのMCPサーバーです。

## セキュリティについて

- **データはローカル処理のみ**: スプレッドシートのデータはあなたのPC上でのみ処理され、Anthropic APIには送信されません
- **学習なし**: データは一切学習に使用されません
- **最小権限**: サービスアカウントに必要最小限の権限のみ付与してください

## セットアップ手順

### 1. Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. **APIとサービス > ライブラリ** から「Google Sheets API」を有効化
4. **APIとサービス > 認証情報** へ移動
5. 「認証情報を作成」→「サービスアカウント」を選択
6. サービスアカウント名を入力（例: `claude-sheets-access`）
7. 作成したサービスアカウントをクリック
8. 「キー」タブ → 「鍵を追加」→「新しい鍵を作成」→ JSON形式を選択
9. ダウンロードしたJSONファイルを `credentials.json` として保存

### 2. スプレッドシートの共有設定

1. アクセスしたいGoogle Spreadsheetを開く
2. 右上の「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`xxx@xxx.iam.gserviceaccount.com`）を追加
4. 権限を「編集者」に設定（読み取りのみの場合は「閲覧者」でOK）

### 3. 認証情報の配置

ダウンロードした `credentials.json` をこのディレクトリに配置:

```bash
cp /path/to/downloaded-credentials.json credentials.json
```

**重要**: `credentials.json` は `.gitignore` に含まれており、Gitにコミットされません。

### 4. ビルド

```bash
npm run build
```

### 5. Claude Desktop/Codeへの登録

Claude Desktopの設定ファイルを編集:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

以下を追加:

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": [
        "C:\\Users\\80036\\Documents\\Obsidian Vault\\mcp-google-sheets\\build\\index.js"
      ]
    }
  }
}
```

**注意**: Windowsの場合、パスは `\\` でエスケープしてください。

### 6. Claude Desktop/Codeの再起動

設定を反映させるため、Claude Desktop/Codeを完全に再起動してください。

## 使い方

Claude Code/Desktopで以下のように指示できます:

### 読み取り

```
スプレッドシートID「1ABC...XYZ」のSheet1のA1:B10を読み取って
```

### 書き込み

```
スプレッドシートID「1ABC...XYZ」のSheet1のA1:B2に以下のデータを書き込んで:
[["名前", "年齢"], ["太郎", "25"]]
```

### 追記

```
スプレッドシートID「1ABC...XYZ」のSheet1!A:Bに新しい行を追加して:
[["次郎", "30"]]
```

### クリア

```
スプレッドシートID「1ABC...XYZ」のSheet1!A1:B10をクリアして
```

## 利用可能なツール

- `sheets_read`: 指定範囲のデータを読み取り
- `sheets_write`: 指定範囲にデータを書き込み（上書き）
- `sheets_append`: 指定範囲の末尾に行を追加
- `sheets_clear`: 指定範囲のデータをクリア

## トラブルシューティング

### 「Google Sheets API not initialized」エラー

- `credentials.json` が正しく配置されているか確認
- サービスアカウントのJSONファイルが正しい形式か確認

### 「Permission denied」エラー

- スプレッドシートがサービスアカウントと共有されているか確認
- サービスアカウントに適切な権限（編集者 or 閲覧者）があるか確認

### Claude Desktop/Codeでツールが表示されない

- `claude_desktop_config.json` のパスが正しいか確認
- Claude Desktop/Codeを完全に再起動
- `npm run build` が成功しているか確認

## スプレッドシートIDの確認方法

Google SheetsのURLから取得できます:

```
https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
                                      ^^^^^^^^^^^
                                      これがID
```
