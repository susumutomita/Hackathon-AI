# Hackathon AI - API ドキュメント

## 概要
Hackathon AI は、過去のハッカソンデータを活用してアイデアの改善と成功確率向上を支援するAPIを提供します。

## ベースURL
```
http://localhost:3000/api
```

## 認証
現在のAPIは認証を必要としませんが、レート制限が適用されています。

## レート制限
- 一般API: 1分間に10リクエスト
- 検索API: 1分間に5リクエスト

レート制限に達した場合、`429 Too Many Requests`レスポンスが返されます。

## 共通エラーレスポンス

### エラーレスポンス形式
```json
{
  "error": "エラータイプ",
  "message": "エラーメッセージ",
  "details": "詳細な説明",
  "suggestions": ["解決方法1", "解決方法2"],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 共通HTTPステータスコード
- `200` - 成功
- `400` - バリデーションエラー
- `405` - 許可されていないHTTPメソッド
- `429` - レート制限に達した
- `500` - サーバーエラー

## API エンドポイント

### 1. アイデア生成

#### `POST /api/generate-idea`

賞金カテゴリーに基づいてアイデアを生成します。

**リクエストボディ**
```json
{
  "prize": "AI/ML賞"
}
```

**パラメータ**
- `prize` (string, required): 対象とする賞金カテゴリー

**レスポンス**
```json
{
  "idea": "生成されたアイデア内容",
  "similarProjects": [
    {
      "title": "類似プロジェクトタイトル",
      "description": "プロジェクト説明",
      "score": 0.85
    }
  ],
  "metadata": {
    "processingTime": 1500,
    "refsCount": 3
  }
}
```

### 2. 勝利アイデア生成

#### `POST /api/generate-winning-idea`

過去の勝利プロジェクトを分析して勝利確率の高いアイデアを生成します。

**リクエストボディ**
```json
{
  "prize": "Web3賞",
  "context": "DeFiプロトコル"
}
```

**パラメータ**
- `prize` (string, required): 対象とする賞金カテゴリー
- `context` (string, optional): 追加のコンテキスト情報

### 3. アイデア改善

#### `POST /api/improve-idea`

既存のアイデアを分析し、改善提案を生成します。

**リクエストボディ**
```json
{
  "idea": "改善したいアイデア内容"
}
```

**パラメータ**
- `idea` (string, required): 改善対象のアイデア

**レスポンス**
```json
{
  "improvedIdea": "改善されたアイデア",
  "suggestions": ["改善提案1", "改善提案2"],
  "similarProjects": [...],
  "metadata": {
    "processingTime": 2000,
    "improvementScore": 8.5
  }
}
```

### 4. アイデア検索

#### `POST /api/search-ideas`

類似するプロジェクトを検索します。

**リクエストボディ**
```json
{
  "idea": "検索したいアイデア"
}
```

**パラメータ**
- `idea` (string, required): 検索クエリとなるアイデア

**レスポンス**
```json
{
  "message": "検索が正常に完了しました",
  "projects": [
    {
      "title": "プロジェクトタイトル",
      "description": "プロジェクト説明",
      "tags": ["tag1", "tag2"],
      "score": 0.92,
      "hackathon": "ETHGlobal Tokyo 2024"
    }
  ],
  "metadata": {
    "searchTime": 800,
    "resultsCount": 5,
    "embeddingTime": 200,
    "vectorSearchTime": 600,
    "cacheStats": {
      "embeddingCacheSize": 100,
      "hitRate": 0.75
    }
  }
}
```

### 5. データクローリング

#### `GET /api/crawl`

ETHGlobalショーケースから新しいプロジェクトデータをクローリングします。

**注意**: この機能は本番環境では無効化されています。

**レスポンス**
```json
{
  "message": "クローリングが正常に完了しました",
  "projects": [...],
  "metadata": {
    "crawlTime": 15000,
    "projectsFound": 50
  }
}
```

### 6. 自動クローリング

#### `POST /api/auto-crawl`

定期的なデータクローリングを実行します。

### 7. イベント更新

#### `POST /api/update-events`

ハッカソンイベント情報を更新します。

### 8. CSRF トークン取得

#### `GET /api/csrf-token`

CSRF保護のためのトークンを取得します。

**レスポンス**
```json
{
  "csrfToken": "generated-csrf-token"
}
```

## パフォーマンス最適化

### キャッシュ機能
- 埋め込みベクトルのキャッシュ
- 検索結果のキャッシュ
- パフォーマンスメトリクスの記録

### タイムアウト設定
- API呼び出し: 30秒
- LLM生成: 60秒
- ベクトル検索: 10秒

## エラーハンドリング

### よくあるエラーと対処法

#### 1. 認証エラー (403)
```json
{
  "error": "Authentication Error",
  "message": "NOMIC_API_KEYが設定されていません",
  "suggestions": [
    "NOMIC_API_KEYが正しく設定されているか確認してください",
    "APIキーが有効であることを確認してください"
  ]
}
```

#### 2. タイムアウトエラー
```json
{
  "error": "Timeout Error",
  "message": "リクエストがタイムアウトしました",
  "suggestions": [
    "ネットワーク接続を確認してください",
    "しばらく時間をおいて再試行してください"
  ]
}
```

#### 3. バリデーションエラー
```json
{
  "error": "Validation Error",
  "message": "入力データが不正です",
  "details": {
    "field": "idea",
    "reason": "必須フィールドが不足しています"
  }
}
```

## 使用例

### JavaScript/TypeScript
```typescript
// アイデア検索の例
const response = await fetch('/api/search-ideas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    idea: 'ブロックチェーンを使ったサプライチェーン管理'
  })
});

const data = await response.json();
console.log(data.projects);
```

### Python
```python
import requests

# アイデア生成の例
response = requests.post('http://localhost:3000/api/generate-idea', 
  json={'prize': 'AI/ML賞'})

if response.status_code == 200:
    data = response.json()
    print(data['idea'])
else:
    print(f"エラー: {response.status_code}")
```

### cURL
```bash
# アイデア改善の例
curl -X POST http://localhost:3000/api/improve-idea \
  -H "Content-Type: application/json" \
  -d '{"idea": "環境問題を解決するアプリ"}'
```

## セキュリティ

### CORS設定
- すべてのオリジンからのアクセスを許可 (`*`)
- 本番環境では特定のドメインに制限することを推奨

### レート制限
- IPアドレスベースの制限
- X-RateLimit-*ヘッダーでクライアントに情報提供

### 入力検証
- Zodスキーマによる厳密な入力検証
- DOMPurifyによるXSS対策
- 入力文字列のサニタイゼーション

## 監視とログ

### パフォーマンスメトリクス
- API応答時間
- ベクトル検索時間
- 埋め込み生成時間
- キャッシュヒット率

### ログレベル
- `info`: 一般的な情報
- `warn`: 警告レベル
- `error`: エラー情報
- `performance`: パフォーマンス指標

## 今後の拡張予定

1. **認証機能の追加**
   - JWT ベースの認証
   - API キー管理

2. **リアルタイム機能**
   - WebSocket サポート
   - リアルタイム通知

3. **高度な分析機能**
   - トレンド分析API
   - 成功確率予測API

4. **バッチ処理**
   - 一括アイデア分析
   - バックグラウンド処理キュー