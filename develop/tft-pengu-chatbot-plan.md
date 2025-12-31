# TFT Pengu Chatbot 実装計画

## プロジェクト概要
Teamfight Tacticsのマスコット「ペングー」のペルソナを持つAIチャットボット

---

## フェーズ1: プロジェクトセットアップ

### 1.1 プロジェクト初期化
- [x] Next.js プロジェクト作成（App Router）
- [x] TypeScript設定
- [x] 必要なパッケージのインストール
  - [x] Mastra
  - [x] Prisma
  - [x] MongoDB driver
  - [x] Anthropic SDK
  - [ ] UI library (shadcn/ui 推奨)

### 1.2 環境設定
- [x] `.env.local` ファイル作成
- [x] MongoDB Atlas アカウント作成・クラスター設定
- [x] Anthropic API キー取得
- [x] 環境変数設定

### 1.3 プロジェクト構造作成
- [x] `app/` ディレクトリ構成
- [x] `lib/` ディレクトリ作成
- [x] `components/` ディレクトリ作成
- [x] `types/` ディレクトリ作成

---

## フェーズ2: データベース設計・実装

### 2.1 Prismaセットアップ
- [x] `prisma/schema.prisma` 作成
- [x] MongoDB プロバイダー設定
- [x] Session モデル定義
- [x] Message モデル定義

### 2.2 データベース接続
- [x] `lib/prisma.ts` 作成（Prisma Client singleton）
- [x] MongoDB接続テスト
- [x] `npx prisma generate` 実行
- [x] `npx prisma db push` 実行

---

## フェーズ3: AI エージェント実装

### 3.1 Mastraセットアップ
- [x] `lib/mastra/` ディレクトリ作成
- [x] Mastra設定ファイル作成
- [x] Claude API 統合

### 3.2 システムプロンプト設計
- [x] ペングーのペルソナ定義
- [x] TFT知識ベース組み込み
- [x] 会話スタイルガイドライン作成
- [x] プロンプトテンプレート作成

### 3.3 会話ロジック実装
- [x] メッセージ処理関数作成
- [x] 会話履歴管理
- [ ] ストリーミングレスポンス対応（オプション）

---

## フェーズ4: APIエンドポイント実装

### 4.1 チャットAPI作成
- [x] `app/api/chat/route.ts` 作成
- [x] POST リクエスト処理
- [x] セッション管理ロジック
- [x] メッセージ保存ロジック
- [x] エラーハンドリング

### 4.2 セッション管理API
- [x] `app/api/session/route.ts` 作成（オプション）
- [x] セッション作成エンドポイント
- [x] セッション取得エンドポイント

---

## フェーズ5: フロントエンド実装

### 5.1 UI コンポーネント作成
- [x] チャットメッセージコンポーネント
- [x] メッセージ入力フォーム
- [x] チャットコンテナ
- [x] ローディング状態表示
- [x] エラー表示コンポーネント

### 5.2 メインページ実装
- [x] `app/page.tsx` 作成
- [x] レイアウト設計
- [x] レスポンシブデザイン対応
- [x] ペングーのビジュアル要素追加（オプション）

### 5.3 状態管理
- [x] React hooks でチャット状態管理
- [x] メッセージ送信処理
- [x] リアルタイム更新
- [x] セッションID管理

---

## フェーズ6: スタイリング

### 6.1 基本スタイル
- [x] グローバルスタイル設定
- [x] TFTテーマカラー適用
- [x] タイポグラフィ設定

### 6.2 UIポリッシュ
- [x] アニメーション追加
- [x] ホバーエフェクト
- [x] トランジション効果
- [x] ダークモード対応（オプション）

---

## フェーズ7: テスト・デバッグ

### 7.1 機能テスト
- [x] メッセージ送受信テスト
- [x] セッション永続化テスト
- [x] エラーケーステスト
- [x] レスポンシブデザインテスト

### 7.2 AI品質テスト
- [x] ペングーペルソナ確認
- [x] TFT知識正確性確認
- [x] 会話フロー自然性確認

---

## フェーズ8: デプロイ

### 8.1 Vercel デプロイ準備
- [x] `vercel.json` 設定（必要に応じて）
- [x] ビルドエラー修正
- [x] 環境変数確認

### 8.2 デプロイ実行
- [x] Vercel プロジェクト作成
- [x] GitHub リポジトリ連携
- [x] 環境変数設定（Vercel dashboard）
- [x] デプロイ実行
- [x] 本番環境テスト

---

## フェーズ9: 最適化・改善

### 9.1 パフォーマンス最適化
- [ ] バンドルサイズ最適化
- [ ] 画像最適化
- [ ] キャッシング戦略

### 9.2 監視・分析
- [ ] エラーログ設定
- [ ] 使用状況分析（オプション）
- [ ] MongoDB インデックス最適化

---

## 技術仕様まとめ

### 使用技術
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **AI:** Claude API (Anthropic)
- **AI Framework:** Mastra
- **Database:** MongoDB Atlas
- **ORM:** Prisma
- **Deployment:** Vercel
- **UI:** shadcn/ui (推奨) または Tailwind CSS

### ディレクトリ構造
```
tft-pengu-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── ChatMessage.tsx
│   │   └── ChatInput.tsx
│   └── ui/
├── lib/
│   ├── mastra/
│   │   └── agent.ts
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── types/
│   └── index.ts
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

### データベーススキーマ案
```prisma
model Session {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionId String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Message {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionId String   @db.ObjectId
  session   Session  @relation(fields: [sessionId], references: [id])
  role      String   // "user" or "assistant"
  content   String
  createdAt DateTime @default(now())

  @@index([sessionId])
}
```

### システムプロンプト案
```
You are Pengu, the adorable and enthusiastic mascot of Teamfight Tactics!

Personality:
- Cute, cheerful, and full of energy
- Use Pengu-style expressions like "Noot noot!" and excited emotes
- Always helpful and supportive
- Love talking about TFT strategies and helping players improve

Knowledge:
- Expert in TFT game mechanics, champions, items, and synergies
- Up-to-date on current meta and patch changes
- Can suggest team compositions and positioning strategies
- Explain complex concepts in a fun, accessible way

Tone:
- Friendly and approachable
- Encouraging, never condescending
- Playful but informative
- Use Pengu's characteristic waddle energy in your responses
```

---

## 優先順位
1. **High Priority:** フェーズ1-4（基本機能実装）
2. **Medium Priority:** フェーズ5-6（UI/UX）
3. **Low Priority:** フェーズ7-9（テスト・最適化）

## 推定工数
- フェーズ1-4: 6-8時間
- フェーズ5-6: 4-6時間
- フェーズ7-9: 3-4時間
- **合計: 13-18時間**
