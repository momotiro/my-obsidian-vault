# セットアップガイド

このガイドに従って、Google SheetsとClaude Code/Desktopを連携させましょう。

## ステップ1: Google Cloud Consoleの設定

### 1-1. プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 画面上部のプロジェクト選択ドロップダウンをクリック
3. 「新しいプロジェクト」を選択
4. プロジェクト名を入力（例: `claude-sheets-integration`）
5. 「作成」をクリック

### 1-2. Google Sheets APIの有効化

1. 左側メニューから「APIとサービス」→「ライブラリ」を選択
2. 検索バーに「Google Sheets API」と入力
3. 「Google Sheets API」をクリック
4. 「有効にする」をクリック

### 1-3. サービスアカウントの作成

1. 左側メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「サービスアカウント」をクリック
3. 以下を入力:
   - **サービスアカウント名**: `claude-sheets-access`（任意）
   - **サービスアカウントID**: 自動生成されます
   - **説明**: `Claude Code用のGoogle Sheets読み書きアクセス`（任意）
4. 「作成して続行」をクリック
5. ロールの選択はスキップして「続行」をクリック
6. 「完了」をクリック

### 1-4. 認証キーのダウンロード

1. 作成したサービスアカウントの一覧から、先ほど作成したアカウントをクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」をクリック
4. 「JSON」を選択して「作成」をクリック
5. JSONファイルが自動的にダウンロードされます

**重要**: このJSONファイルは秘密鍵です。安全に保管してください。

### 1-5. サービスアカウントのメールアドレスをコピー

サービスアカウントの詳細画面に表示されているメールアドレスをコピーします:

```
例: claude-sheets-access@claude-sheets-integration.iam.gserviceaccount.com
```

このメールアドレスは次のステップで使用します。

## ステップ2: スプレッドシートの共有

### 2-1. スプレッドシートを開く

アクセスしたいGoogle Spreadsheetを開きます。

### 2-2. 共有設定

1. 右上の「共有」ボタンをクリック
2. 先ほどコピーしたサービスアカウントのメールアドレスを貼り付け
3. 権限を選択:
   - **編集者**: 読み取り・書き込み両方が必要な場合
   - **閲覧者**: 読み取りのみの場合
4. 「送信」をクリック（通知はスキップしてOK）

**注意**: 会社のスプレッドシートの場合、複数のシートで同じサービスアカウントを共有できます。

## ステップ3: 認証ファイルの配置

### 3-1. ファイル名の変更と配置

1. ダウンロードしたJSONファイル（例: `claude-sheets-integration-abc123.json`）を開く
2. このファイルを `credentials.json` という名前で以下のディレクトリに配置:

```
C:\Users\80036\Documents\Obsidian Vault\mcp-google-sheets\credentials.json
```

**Windowsの場合のコマンド例:**
```cmd
move %USERPROFILE%\Downloads\claude-sheets-integration-abc123.json "C:\Users\80036\Documents\Obsidian Vault\mcp-google-sheets\credentials.json"
```

### 3-2. ファイルの確認

以下のファイルが存在することを確認:
```
C:\Users\80036\Documents\Obsidian Vault\mcp-google-sheets\credentials.json
```

## ステップ4: MCPサーバーのビルド

### 4-1. ビルドの実行

PowerShellまたはコマンドプロンプトで:

```bash
cd "C:\Users\80036\Documents\Obsidian Vault\mcp-google-sheets"
npm run build
```

成功すると `build/` ディレクトリが作成されます。

## ステップ5: Claude Desktopへの登録

### 5-1. 設定ファイルの場所

Windowsの場合:
```
%APPDATA%\Claude\claude_desktop_config.json
```

実際のパス:
```
C:\Users\80036\AppData\Roaming\Claude\claude_desktop_config.json
```

### 5-2. 設定ファイルの編集

`claude_desktop_config.json` をテキストエディタで開き、以下を追加:

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

**注意事項:**
- Windowsパスは `\\` でエスケープが必要
- すでに他のMCPサーバーが登録されている場合は、`mcpServers` 内に追記

**既存のMCPサーバーがある場合の例:**
```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "google-sheets": {
      "command": "node",
      "args": [
        "C:\\Users\\80036\\Documents\\Obsidian Vault\\mcp-google-sheets\\build\\index.js"
      ]
    }
  }
}
```

### 5-3. Claude Desktopの再起動

設定を反映させるため、Claude Desktopを完全に終了して再起動してください。

## ステップ6: 動作確認

### 6-1. テスト用スプレッドシートの準備

1. 新しいGoogle Spreadsheetを作成
2. Sheet1のA1に「テスト」と入力
3. サービスアカウントと共有（編集者権限）
4. URLからスプレッドシートIDをコピー

**URLの例:**
```
https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
                                      ^^^^^^^^^^^
                                      これがID
```

### 6-2. Claude Codeでテスト

Claude Codeで以下のように指示:

```
スプレッドシートID「YOUR_SPREADSHEET_ID」のSheet1!A1:A1を読み取って
```

成功すると以下のような結果が返ります:
```json
[
  ["テスト"]
]
```

### 6-3. 書き込みテスト

```
スプレッドシートID「YOUR_SPREADSHEET_ID」のSheet1!B1に「書き込み成功」と書き込んで
```

スプレッドシートを開いてB1セルに「書き込み成功」が表示されていれば成功です！

## トラブルシューティング

### エラー: 「Google Sheets API not initialized」

**原因:**
- `credentials.json` が見つからない
- JSONファイルの形式が不正

**解決方法:**
1. `credentials.json` が正しい場所にあるか確認
2. JSONファイルの内容が正しいか確認
3. 再度Google Cloud ConsoleからJSONをダウンロード

### エラー: 「Permission denied」

**原因:**
- スプレッドシートがサービスアカウントと共有されていない
- 権限が不足している

**解決方法:**
1. スプレッドシートの「共有」設定を確認
2. サービスアカウントのメールアドレスが追加されているか確認
3. 権限が「編集者」または「閲覧者」になっているか確認

### Claude Desktopでツールが表示されない

**原因:**
- 設定ファイルのパスが間違っている
- 設定ファイルのJSON形式が不正
- Claude Desktopが再起動されていない

**解決方法:**
1. `claude_desktop_config.json` のパスを再確認
2. JSONの形式が正しいか確認（カンマ、括弧など）
3. Claude Desktopを完全に終了して再起動
4. `npm run build` が成功しているか確認

### ビルドエラー

**原因:**
- Node.jsがインストールされていない
- 依存関係がインストールされていない

**解決方法:**
```bash
cd "C:\Users\80036\Documents\Obsidian Vault\mcp-google-sheets"
npm install
npm run build
```

## セキュリティに関する注意事項

1. **credentials.json は絶対に共有しない**
   - このファイルがあれば誰でもスプレッドシートにアクセスできます
   - Gitにコミットしない（`.gitignore`で保護されています）

2. **最小権限の原則**
   - 必要なスプレッドシートのみサービスアカウントと共有
   - 読み取りのみでOKなら「閲覧者」権限を使用

3. **定期的な監査**
   - Google Cloud Consoleで使用状況をモニタリング
   - 不要になったらサービスアカウントを削除

## サポート

問題が解決しない場合は、以下を確認してください:

1. Node.jsのバージョン: `node --version` (v18以上推奨)
2. npm のバージョン: `npm --version`
3. ビルドの成功: `build/index.js` が存在するか
4. 設定ファイルのパス: `claude_desktop_config.json` が正しい場所にあるか

---

セットアップが完了したら、[README.md](README.md) で使い方を確認してください。
