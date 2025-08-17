# Hackathon AI - トラブルシューティングガイド

## 目次
1. [一般的な問題と解決方法](#一般的な問題と解決方法)
2. [セットアップに関する問題](#セットアップに関する問題)
3. [API関連の問題](#api関連の問題)
4. [パフォーマンスの問題](#パフォーマンスの問題)
5. [デバッグ方法](#デバッグ方法)
6. [ログ解析](#ログ解析)
7. [外部サービス連携の問題](#外部サービス連携の問題)
8. [よくある質問(FAQ)](#よくある質問faq)

## 一般的な問題と解決方法

### 1. アプリケーションが起動しない

#### 症状
```bash
$ pnpm dev
Error: Cannot find module '@/lib/env'
```

#### 原因と解決方法

##### 原因1: 依存関係がインストールされていない
```bash
# 解決方法
pnpm install

# MCPサーバーの依存関係もインストール
cd mcp-server && pnpm install && cd ..
```

##### 原因2: 環境変数が設定されていない
```bash
# .env.local ファイルを確認
cat .env.local

# 必要な環境変数が設定されているか確認
echo $QD_URL
echo $NOMIC_API_KEY
```

##### 原因3: Node.js バージョンが古い
```bash
# Node.js バージョン確認
node --version

# 18.0.0 以上が必要
# nvm を使用してアップグレード
nvm install 18
nvm use 18
```

### 2. 型エラーが解決しない

#### 症状
```
TypeScript error: Property 'qdrantHandler' does not exist on type 'GlobalThis'
```

#### 解決方法
```bash
# 型チェックを実行
pnpm typecheck

# TypeScriptキャッシュをクリア
rm -rf .next
rm -rf node_modules/.cache

# 再インストール
pnpm install
```

### 3. テストが失敗する

#### 症状
```bash
$ pnpm test
FAIL src/__tests__/api/search-ideas.test.ts
```

#### 解決方法
```bash
# テスト環境の環境変数を確認
cat vitest.setup.ts

# モックが正しく設定されているか確認
# テストデータベースの初期化
pnpm test --run --reporter=verbose
```

## セットアップに関する問題

### 1. Ollama接続エラー

#### 症状
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

#### 解決方法

##### 手順1: Ollamaサービスの確認
```bash
# Ollamaが起動しているか確認
curl http://localhost:11434/api/tags

# サービス開始
ollama serve

# 必要なモデルをダウンロード
ollama pull llama2:7b
ollama list
```

##### 手順2: 環境変数の確認
```bash
# .env.local の確認
OLLAMA_BASE_URL=http://localhost:11434

# 環境変数の読み込み確認
echo $OLLAMA_BASE_URL
```

##### 手順3: ファイアウォール設定
```bash
# macOS
sudo pfctl -f /etc/pf.conf

# Linux (Ubuntu)
sudo ufw allow 11434
```

### 2. Qdrant接続エラー

#### 症状
```
QdrantError: Service unavailable
```

#### 解決方法

##### Docker使用の場合
```bash
# Qdrantコンテナの状態確認
docker ps | grep qdrant

# コンテナの起動
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# ヘルスチェック
curl http://localhost:6333/health
```

##### 直接インストールの場合
```bash
# Qdrantの状態確認
systemctl status qdrant

# サービス開始
sudo systemctl start qdrant

# ログ確認
journalctl -u qdrant -f
```

### 3. Nomic API認証エラー

#### 症状
```
Error: 403 Forbidden - Invalid API key
```

#### 解決方法
```bash
# APIキーの確認
echo $NOMIC_API_KEY

# APIキーの有効性テスト
curl -H "Authorization: Bearer $NOMIC_API_KEY" \
     "https://api-atlas.nomic.ai/v1/embedding/text"

# 新しいAPIキーの取得
# https://atlas.nomic.ai/ でアカウント作成
```

## API関連の問題

### 1. API応答タイムアウト

#### 症状
```json
{
  "error": "Timeout Error",
  "message": "リクエストがタイムアウトしました"
}
```

#### 解決方法

##### 手順1: タイムアウト値の調整
```typescript
// lib/config.ts
export const CONFIG = {
  API_TIMEOUT: 60000, // 60秒に延長
  LLM_TIMEOUT: 120000, // 2分に延長
};
```

##### 手順2: サービス状態の確認
```bash
# Ollamaの応答速度テスト
time curl -X POST http://localhost:11434/api/generate \
  -d '{"model": "llama2:7b", "prompt": "Hello"}'

# Qdrantの応答速度テスト
time curl http://localhost:6333/collections
```

##### 手順3: システムリソースの確認
```bash
# メモリ使用量
free -h

# CPU使用率
top -n 1

# ディスクI/O
iostat 1 3
```

### 2. レート制限エラー

#### 症状
```json
{
  "error": "Rate Limit Error",
  "message": "Too many requests"
}
```

#### 解決方法
```typescript
// lib/rateLimit.ts の設定調整
const RATE_LIMITS = {
  API: 20,        // 1分間のリクエスト数を増加
  SEARCH: 10,     // 検索APIの制限を緩和
  CRAWL: 2        // クローリングAPIの制限を調整
};
```

### 3. CORS エラー

#### 症状
```
Access to fetch at 'http://localhost:3000/api/search-ideas' from origin 'http://localhost:3001' has been blocked by CORS policy
```

#### 解決方法
```typescript
// pages/api/search-ideas.ts
res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGINS || "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
```

## パフォーマンスの問題

### 1. API応答が遅い

#### 診断方法
```bash
# API応答時間の測定
curl -w "Total time: %{time_total}s\n" \
  -X POST http://localhost:3000/api/search-ideas \
  -H "Content-Type: application/json" \
  -d '{"idea": "test"}'
```

#### 最適化手順

##### データベースクエリ最適化
```typescript
// lib/qdrantHandler.ts
class QdrantHandler {
  // インデックスの追加
  async optimizeCollection() {
    await this.client.updateCollection(this.collectionName, {
      optimizers_config: {
        default_segment_number: 2,
        max_segment_size: 20000,
      }
    });
  }
  
  // キャッシュの活用
  private cache = new Map<string, SearchResult[]>();
  
  async searchSimilarProjects(embedding: number[], limit = 10) {
    const cacheKey = this.hashEmbedding(embedding);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const results = await this.performSearch(embedding, limit);
    this.cache.set(cacheKey, results);
    return results;
  }
}
```

##### LLM応答最適化
```typescript
// lib/ideaAgent.ts
export class IdeaAgent {
  // ストリーミング応答の実装
  async generateIdeaStream(prize: string): Promise<ReadableStream> {
    return new ReadableStream({
      async start(controller) {
        const stream = await this.llmAdapter.generateStream(prompt);
        
        for await (const chunk of stream) {
          controller.enqueue(chunk);
        }
        
        controller.close();
      }
    });
  }
}
```

### 2. メモリ使用量が多い

#### 診断方法
```bash
# Node.jsプロセスのメモリ使用量
ps aux | grep node

# ヒープダンプの生成
node --inspect src/scripts/memoryDump.js
```

#### 対策

##### メモリリークの修正
```typescript
// 適切なクリーンアップ
export class QdrantHandler {
  private timers: NodeJS.Timer[] = [];
  
  cleanup() {
    this.timers.forEach(timer => clearInterval(timer));
    this.cache.clear();
    this.client.close();
  }
}

// プロセス終了時のクリーンアップ
process.on('SIGTERM', () => {
  qdrantHandler.cleanup();
  process.exit(0);
});
```

##### キャッシュサイズの制限
```typescript
// LRU キャッシュの実装
class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, V>();
  
  set(key: K, value: V) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## デバッグ方法

### 1. 詳細ログの有効化

#### 環境変数設定
```bash
# .env.local
LOG_LEVEL=debug
DEBUG_MODE=true
VERBOSE_LOGGING=true
```

#### ログ出力の確認
```bash
# リアルタイムログ監視
tail -f logs/app.log

# エラーログのフィルタリング
grep "ERROR" logs/app.log | tail -20

# パフォーマンスログの分析
grep "Performance" logs/app.log | awk '{print $NF}' | sort -n
```

### 2. APIエンドポイントのテスト

#### cURL を使用したテスト
```bash
# アイデア検索のテスト
curl -X POST http://localhost:3000/api/search-ideas \
  -H "Content-Type: application/json" \
  -d '{"idea": "blockchain voting system"}' \
  -v

# アイデア生成のテスト
curl -X POST http://localhost:3000/api/generate-idea \
  -H "Content-Type: application/json" \
  -d '{"prize": "AI/ML賞"}' \
  -v
```

#### Postman Collection
```json
{
  "info": {
    "name": "Hackathon AI API Tests"
  },
  "item": [
    {
      "name": "Search Ideas",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "raw": "{\"idea\": \"test idea\"}"
        },
        "url": "{{baseUrl}}/api/search-ideas"
      }
    }
  ]
}
```

### 3. ブラウザ開発者ツール

#### Network タブでの確認
- リクエスト/レスポンスの内容
- 応答時間の測定
- エラーステータスコードの確認

#### Console でのデバッグ
```javascript
// ブラウザコンソールでのAPI呼び出し
fetch('/api/search-ideas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idea: 'test' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
```

## ログ解析

### 1. ログ形式の理解

#### 標準ログ形式
```json
{
  "level": "info",
  "message": "API request started",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metadata": {
    "endpoint": "/api/search-ideas",
    "method": "POST",
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

#### エラーログ形式
```json
{
  "level": "error",
  "message": "External service error",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "error": {
    "name": "ExternalServiceError",
    "message": "Qdrant connection failed",
    "stack": "Error: Qdrant connection failed\n    at..."
  },
  "metadata": {
    "service": "qdrant",
    "endpoint": "http://localhost:6333"
  }
}
```

### 2. ログ分析コマンド

#### 基本的な分析
```bash
# エラー頻度の確認
grep -c "level.*error" logs/app.log

# 最も多いエラーの特定
grep "level.*error" logs/app.log | \
  jq -r '.error.message' | \
  sort | uniq -c | sort -nr

# API応答時間の分析
grep "Performance.*completed" logs/app.log | \
  jq -r '.metadata.duration' | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count "ms"}'
```

#### 高度な分析
```bash
# 時間別エラー分布
grep "level.*error" logs/app.log | \
  jq -r '.timestamp' | \
  cut -d'T' -f2 | cut -d':' -f1 | \
  sort | uniq -c

# ユーザーエージェント別アクセス統計
grep "API request started" logs/app.log | \
  jq -r '.metadata.userAgent' | \
  cut -d' ' -f1 | sort | uniq -c | sort -nr
```

### 3. ログローテーション

#### 設定例
```javascript
// lib/logger.ts
import DailyRotateFile from 'winston-daily-rotate-file';

const transport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

logger.add(transport);
```

## 外部サービス連携の問題

### 1. Ollama関連の問題

#### モデルが見つからない
```bash
# 利用可能なモデルの確認
ollama list

# 新しいモデルのダウンロード
ollama pull llama2:7b

# モデルの詳細確認
ollama show llama2:7b
```

#### メモリ不足エラー
```bash
# Ollamaの設定調整
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_NUM_PARALLEL=1

# システムメモリの確認
free -h
```

### 2. Qdrant関連の問題

#### コレクションが存在しない
```bash
# コレクション一覧の確認
curl http://localhost:6333/collections

# コレクションの作成
curl -X PUT http://localhost:6333/collections/hackathon_projects \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }'
```

#### インデックス破損
```bash
# Qdrantの完全リセット
docker stop qdrant-container
docker rm qdrant-container
rm -rf ./qdrant_storage
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

### 3. Nomic API関連の問題

#### APIクォータ超過
```bash
# 使用量の確認
curl -H "Authorization: Bearer $NOMIC_API_KEY" \
     "https://api-atlas.nomic.ai/v1/account/usage"

# 代替案：ローカル埋め込みモデルの使用
# sentence-transformers などを検討
```

## よくある質問(FAQ)

### Q1: 開発環境でプロダクションAPIが呼ばれてしまう
**A:** 環境変数の設定を確認してください。
```bash
# .env.local
NEXT_PUBLIC_ENVIRONMENT=development
```

### Q2: テストが他のテストに影響を与える
**A:** テストの独立性を確保してください。
```typescript
// 各テストでのクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
  cache.clear();
});
```

### Q3: Docker環境でホットリロードが動作しない
**A:** ボリュームマウントとポーリング設定を確認してください。
```dockerfile
# Dockerfile.dev
ENV WATCHPACK_POLLING=true
VOLUME ["/app/node_modules"]
```

### Q4: プロダクションビルドが失敗する
**A:** 型エラーと未使用の依存関係を確認してください。
```bash
# 型チェック
pnpm typecheck

# 未使用依存関係の確認
npx depcheck

# ビルド詳細ログ
VERBOSE=1 pnpm build
```

### Q5: API応答が遅い
**A:** プロファイリングとキャッシュ戦略を見直してください。
```typescript
// パフォーマンス測定
const startTime = Date.now();
const result = await expensiveOperation();
logger.performanceLog('Operation', Date.now() - startTime);
```

### Q6: メモリリークが発生する
**A:** リソースの適切なクリーンアップを実装してください。
```typescript
// cleanup関数の実装
const cleanup = () => {
  clearInterval(timer);
  cache.clear();
  connection.close();
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
```

## サポートとヘルプ

### 技術サポート
- **GitHub Issues**: [プロジェクトのIssues](https://github.com/susumutomita/Hackathon-AI/issues)
- **ドキュメント**: [docs/](./docs/)フォルダ内の関連ドキュメント

### 緊急時の対応
1. **サービス停止**: `docker-compose down && docker-compose up -d`
2. **ログの確認**: `tail -f logs/app.log`
3. **データバックアップ**: `cp -r qdrant_storage qdrant_storage.backup`

### 継続的な改善
- 定期的なログ分析によるパフォーマンス監視
- ユーザーフィードバックの収集と対応
- セキュリティパッチの適用とアップデート

このトラブルシューティングガイドを参考に、問題の迅速な特定と解決を行ってください。新しい問題が発見された場合は、このドキュメントの更新もお願いします。