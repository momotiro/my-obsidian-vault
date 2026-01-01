# PR作成ガイド - Phase 4 & Phase 5

## Phase 4のPR作成手順

### 1. ブラウザでPR作成ページを開く

以下のURLにアクセスしてください：

**Phase 4 PR作成URL:**
```
https://github.com/momotiro/my-obsidian-vault/pull/new/feature/phase-4-reports-api
```

### 2. PR情報を入力

#### タイトル
```
feat: Phase 4 Reports API (Issues #16-20)
```

#### 説明文
`develop/discord-monitor-report-phase4/PR-DESCRIPTION.md` の内容をコピーして貼り付けてください。

または、以下のコマンドで内容を確認できます：
```bash
cat "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report-phase4\PR-DESCRIPTION.md"
```

### 3. PRラベルとアサイン（任意）

- **Labels:** `enhancement`, `phase-4`, `backend`
- **Reviewers:** コードレビューを依頼したい人
- **Assignees:** 自分自身
- **Milestone:** Discord Monitor Report v1.0（存在する場合）

### 4. "Create pull request" をクリック

---

## Phase 5のPR作成手順

### 1. ブラウザでPR作成ページを開く

以下のURLにアクセスしてください：

**Phase 5 PR作成URL:**
```
https://github.com/momotiro/my-obsidian-vault/pull/new/feature/phase-5-comments-api
```

### 2. PR情報を入力

#### タイトル
```
feat: Phase 5 Comments API (Issues #21-25)
```

#### 説明文
`develop/discord-monitor-report-phase5/PR-DESCRIPTION.md` の内容をコピーして貼り付けてください。

または、以下のコマンドで内容を確認できます：
```bash
cat "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report-phase5\PR-DESCRIPTION.md"
```

### 3. PRラベルとアサイン（任意）

- **Labels:** `enhancement`, `phase-5`, `backend`
- **Reviewers:** コードレビューを依頼したい人
- **Assignees:** 自分自身
- **Milestone:** Discord Monitor Report v1.0（存在する場合）

### 4. "Create pull request" をクリック

---

## PR作成後の確認事項

### ✅ 両方のPRで確認すること

1. **Checks通過確認**
   - GitHub Actionsが実行される場合、すべてのチェックが通過することを確認
   - TypeScriptコンパイル
   - ESLint
   - テスト実行

2. **Conflicts確認**
   - mainブランチとのコンフリクトがないことを確認
   - コンフリクトがある場合は解決

3. **Files Changed確認**
   - 意図したファイルのみが変更されていることを確認
   - 不要なファイル（.vscode/, node_modules/等）が含まれていないか確認

4. **Commit履歴確認**
   - コミットメッセージが適切か確認
   - 不要なコミットが含まれていないか確認

---

## マージ順序

⚠️ **重要:** Phase 5はPhase 4に依存しているため、以下の順序でマージしてください：

1. **Phase 4をmainにマージ** ← 先にこちら
2. Phase 5をPhase 4マージ後のmainにリベース（必要な場合）
3. **Phase 5をmainにマージ**

---

## コードレビュー待機中にやること

### オプション: 自己レビュー

1. **コード品質チェック**
   - コードの可読性
   - 適切なエラーハンドリング
   - セキュリティ上の問題がないか

2. **テストカバレッジ確認**
   - すべてのエッジケースがテストされているか
   - エラーケースがテストされているか

3. **ドキュメント確認**
   - API仕様書との整合性
   - コメントの適切性

### オプション: 手動テスト準備

開発サーバーで手動テストを行う場合：

```bash
# Phase 4のテスト
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report-phase4\develop\discord-monitor-report"
npm run dev

# Phase 5のテスト
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report-phase5\develop\discord-monitor-report"
npm run dev
```

---

## PR作成完了後

両方のPRを作成したら、以下の情報を記録してください：

- **Phase 4 PR番号:** #___
- **Phase 5 PR番号:** #___

これらの番号は後でマージ時に使用します。

---

## トラブルシューティング

### PRページが404エラーになる場合

ブランチがリモートにプッシュされているか確認：
```bash
git branch -r | grep "phase-4\|phase-5"
```

以下が表示されるはずです：
```
origin/feature/phase-4-reports-api
origin/feature/phase-5-comments-api
```

### ブランチが見つからない場合

再度プッシュ：
```bash
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report-phase4\develop\discord-monitor-report"
git push -u origin feature/phase-4-reports-api

cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report-phase5"
git push -u origin feature/phase-5-comments-api
```

---

**準備完了！** 上記のURLからPRを作成してください 🚀
