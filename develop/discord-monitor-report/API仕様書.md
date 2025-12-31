# Discord監視日報システム API仕様書

## 1. 共通仕様

### 1.1 ベースURL
```
http://localhost:3000/api
```

### 1.2 認証方式
- JWT (JSON Web Token) を使用
- ログイン後、トークンをレスポンスで返却
- 以降のリクエストは `Authorization` ヘッダーにトークンを含める

```
Authorization: Bearer {token}
```

### 1.3 共通レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": { ... }
}
```

#### エラー時
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 1.4 HTTPステータスコード
| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエストエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 500 | サーバーエラー |

---

## 2. 認証API

### 2.1 ログイン

#### エンドポイント
```
POST /auth/login
```

#### リクエスト
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "name": "山田太郎",
      "email": "user@example.com",
      "role": "staff"
    }
  }
}
```

#### エラー (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### 2.2 ログアウト

#### エンドポイント
```
POST /auth/logout
```

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

---

### 2.3 ユーザー情報取得

#### エンドポイント
```
GET /auth/me
```

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "name": "山田太郎",
    "email": "user@example.com",
    "role": "staff",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

## 3. 日報API

### 3.1 日報一覧取得

#### エンドポイント
```
GET /reports
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-------|------|------|
| user_id | integer | - | 担当者ID（上長のみ指定可、未指定で全員） |
| start_date | date | - | 開始日 (YYYY-MM-DD) |
| end_date | date | - | 終了日 (YYYY-MM-DD) |
| page | integer | - | ページ番号（デフォルト: 1） |
| limit | integer | - | 1ページあたりの件数（デフォルト: 20） |

#### リクエスト例
```
GET /reports?start_date=2025-12-01&end_date=2025-12-31&page=1&limit=10
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "report_id": 1,
        "user_id": 1,
        "user_name": "山田太郎",
        "report_date": "2025-12-31",
        "monitoring_count": 3,
        "comment_count": 1,
        "has_unread_comments": true,
        "created_at": "2025-12-31T09:00:00Z",
        "updated_at": "2025-12-31T10:00:00Z"
      },
      {
        "report_id": 2,
        "user_id": 1,
        "user_name": "山田太郎",
        "report_date": "2025-12-30",
        "monitoring_count": 2,
        "comment_count": 0,
        "has_unread_comments": false,
        "created_at": "2025-12-30T09:00:00Z",
        "updated_at": "2025-12-30T09:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 50,
      "limit": 10
    }
  }
}
```

---

### 3.2 日報詳細取得

#### エンドポイント
```
GET /reports/{report_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| report_id | integer | 日報ID |

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "user_id": 1,
    "user_name": "山田太郎",
    "report_date": "2025-12-31",
    "problem": "スパム投稿が増加傾向。自動検知の精度向上が必要かもしれません。",
    "plan": "・Cサーバーの新規ルール周知\n・自動検知ツールの設定見直し",
    "monitoring_records": [
      {
        "record_id": 1,
        "server_id": 1,
        "server_name": "Aサーバー",
        "monitoring_content": "・ユーザー投稿のチェック\n・不適切な画像3件削除",
        "created_at": "2025-12-31T09:00:00Z"
      },
      {
        "record_id": 2,
        "server_id": 2,
        "server_name": "Bサーバー",
        "monitoring_content": "・新規メンバー5名参加\n・ルール違反なし",
        "created_at": "2025-12-31T09:05:00Z"
      }
    ],
    "comments": [
      {
        "comment_id": 1,
        "user_id": 2,
        "user_name": "佐藤部長",
        "target_field": "problem",
        "comment_text": "来週の定例会議で自動検知について議論しましょう。",
        "created_at": "2025-12-31T10:30:00Z"
      }
    ],
    "created_at": "2025-12-31T09:00:00Z",
    "updated_at": "2025-12-31T10:00:00Z"
  }
}
```

#### エラー (404)
```json
{
  "success": false,
  "error": {
    "code": "REPORT_NOT_FOUND",
    "message": "日報が見つかりません"
  }
}
```

---

### 3.3 日報作成

#### エンドポイント
```
POST /reports
```

#### リクエスト
```json
{
  "report_date": "2025-12-31",
  "problem": "スパム投稿が増加傾向。自動検知の精度向上が必要かもしれません。",
  "plan": "・Cサーバーの新規ルール周知\n・自動検知ツールの設定見直し",
  "monitoring_records": [
    {
      "server_id": 1,
      "monitoring_content": "・ユーザー投稿のチェック\n・不適切な画像3件削除"
    },
    {
      "server_id": 2,
      "monitoring_content": "・新規メンバー5名参加\n・ルール違反なし"
    }
  ]
}
```

#### レスポンス (201)
```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "user_id": 1,
    "report_date": "2025-12-31",
    "problem": "スパム投稿が増加傾向。自動検知の精度向上が必要かもしれません。",
    "plan": "・Cサーバーの新規ルール周知\n・自動検知ツールの設定見直し",
    "created_at": "2025-12-31T09:00:00Z"
  }
}
```

#### エラー (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "監視報告は1件以上必要です"
  }
}
```

---

### 3.4 日報更新

#### エンドポイント
```
PUT /reports/{report_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| report_id | integer | 日報ID |

#### リクエスト
```json
{
  "problem": "スパム投稿が増加。対策を検討中。",
  "plan": "・自動検知ツールの導入検討",
  "monitoring_records": [
    {
      "record_id": 1,
      "server_id": 1,
      "monitoring_content": "・ユーザー投稿のチェック\n・不適切な画像5件削除"
    },
    {
      "server_id": 3,
      "monitoring_content": "・新規サーバーの初期設定"
    }
  ]
}
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "updated_at": "2025-12-31T11:00:00Z"
  }
}
```

#### エラー (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "この日報を編集する権限がありません"
  }
}
```

---

### 3.5 日報削除

#### エンドポイント
```
DELETE /reports/{report_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| report_id | integer | 日報ID |

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "message": "日報を削除しました"
  }
}
```

---

## 4. コメントAPI

### 4.1 コメント作成

#### エンドポイント
```
POST /reports/{report_id}/comments
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| report_id | integer | 日報ID |

#### リクエスト
```json
{
  "target_field": "problem",
  "comment_text": "来週の定例会議で自動検知について議論しましょう。"
}
```

#### フィールド説明
| フィールド | 型 | 必須 | 説明 |
|-----------|-------|------|------|
| target_field | string | ○ | "problem" または "plan" |
| comment_text | string | ○ | コメント内容 |

#### レスポンス (201)
```json
{
  "success": true,
  "data": {
    "comment_id": 1,
    "report_id": 1,
    "user_id": 2,
    "user_name": "佐藤部長",
    "target_field": "problem",
    "comment_text": "来週の定例会議で自動検知について議論しましょう。",
    "created_at": "2025-12-31T10:30:00Z"
  }
}
```

#### エラー (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "コメント機能は上長のみ利用できます"
  }
}
```

---

### 4.2 コメント更新

#### エンドポイント
```
PUT /comments/{comment_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| comment_id | integer | コメントID |

#### リクエスト
```json
{
  "comment_text": "来週の定例会議で詳しく話しましょう。"
}
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "comment_id": 1,
    "updated_at": "2025-12-31T11:00:00Z"
  }
}
```

---

### 4.3 コメント削除

#### エンドポイント
```
DELETE /comments/{comment_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| comment_id | integer | コメントID |

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "message": "コメントを削除しました"
  }
}
```

---

## 5. マスタ管理API

### 5.1 Discordサーバー一覧取得

#### エンドポイント
```
GET /masters/servers
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-------|------|------|
| is_active | boolean | - | 有効/無効フィルタ |

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "server_id": 1,
        "server_name": "Aサーバー",
        "description": "メインサーバー",
        "is_active": true,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      },
      {
        "server_id": 2,
        "server_name": "Bサーバー",
        "description": "サブサーバー",
        "is_active": true,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 5.2 Discordサーバー作成

#### エンドポイント
```
POST /masters/servers
```

#### リクエスト
```json
{
  "server_name": "Cサーバー",
  "description": "新規サーバー",
  "is_active": true
}
```

#### レスポンス (201)
```json
{
  "success": true,
  "data": {
    "server_id": 3,
    "server_name": "Cサーバー",
    "description": "新規サーバー",
    "is_active": true,
    "created_at": "2025-12-31T12:00:00Z"
  }
}
```

#### エラー (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "マスタ管理は上長のみ利用できます"
  }
}
```

---

### 5.3 Discordサーバー更新

#### エンドポイント
```
PUT /masters/servers/{server_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| server_id | integer | サーバーID |

#### リクエスト
```json
{
  "server_name": "Cサーバー（更新）",
  "description": "説明更新",
  "is_active": false
}
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "server_id": 3,
    "updated_at": "2025-12-31T13:00:00Z"
  }
}
```

---

### 5.4 Discordサーバー削除

#### エンドポイント
```
DELETE /masters/servers/{server_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| server_id | integer | サーバーID |

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "message": "サーバーを削除しました"
  }
}
```

#### エラー (400)
```json
{
  "success": false,
  "error": {
    "code": "SERVER_IN_USE",
    "message": "このサーバーは使用中のため削除できません"
  }
}
```

---

### 5.5 担当者一覧取得

#### エンドポイント
```
GET /masters/users
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-------|------|------|
| role | string | - | "staff" または "manager" |

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": 1,
        "name": "山田太郎",
        "email": "yamada@example.com",
        "role": "staff",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      },
      {
        "user_id": 2,
        "name": "佐藤部長",
        "email": "sato@example.com",
        "role": "manager",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 5.6 担当者作成

#### エンドポイント
```
POST /masters/users
```

#### リクエスト
```json
{
  "name": "鈴木一郎",
  "email": "suzuki@example.com",
  "password": "password123",
  "role": "staff"
}
```

#### レスポンス (201)
```json
{
  "success": true,
  "data": {
    "user_id": 3,
    "name": "鈴木一郎",
    "email": "suzuki@example.com",
    "role": "staff",
    "created_at": "2025-12-31T14:00:00Z"
  }
}
```

---

### 5.7 担当者更新

#### エンドポイント
```
PUT /masters/users/{user_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| user_id | integer | ユーザーID |

#### リクエスト
```json
{
  "name": "鈴木一郎（更新）",
  "email": "suzuki_new@example.com",
  "role": "manager"
}
```

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "user_id": 3,
    "updated_at": "2025-12-31T15:00:00Z"
  }
}
```

---

### 5.8 担当者削除

#### エンドポイント
```
DELETE /masters/users/{user_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-------|------|
| user_id | integer | ユーザーID |

#### レスポンス (200)
```json
{
  "success": true,
  "data": {
    "message": "担当者を削除しました"
  }
}
```

---

## 6. エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| INVALID_CREDENTIALS | 401 | メールアドレスまたはパスワードが正しくない |
| UNAUTHORIZED | 401 | 認証されていない |
| FORBIDDEN | 403 | 権限がない |
| REPORT_NOT_FOUND | 404 | 日報が見つからない |
| SERVER_NOT_FOUND | 404 | サーバーが見つからない |
| USER_NOT_FOUND | 404 | ユーザーが見つからない |
| VALIDATION_ERROR | 400 | バリデーションエラー |
| SERVER_IN_USE | 400 | サーバーが使用中 |
| USER_IN_USE | 400 | ユーザーが使用中 |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

---

## 7. API仕様変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0.0 | 2025-12-31 | 初版作成 |
