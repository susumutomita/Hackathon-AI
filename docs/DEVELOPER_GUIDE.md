# Hackathon AI - 開発者ガイド

## 目次
1. [開発環境セットアップ](#開発環境セットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [開発ワークフロー](#開発ワークフロー)
4. [コーディング規約](#コーディング規約)
5. [テスト戦略](#テスト戦略)
6. [パフォーマンス最適化](#パフォーマンス最適化)
7. [デバッグ方法](#デバッグ方法)
8. [貢献ガイドライン](#貢献ガイドライン)

## 開発環境セットアップ

### 前提条件
- Node.js 18.0.0 以上
- PNPM 8.0.0 以上
- Git
- Docker（オプション）

### 必須サービス
1. **Ollama**: ローカル LLM 実行環境
2. **Qdrant**: ベクトルデータベース
3. **Nomic AI**: 埋め込み API

### 初期セットアップ

#### 1. リポジトリのクローン
```bash
git clone https://github.com/susumutomita/Hackathon-AI.git
cd Hackathon-AI
```

#### 2. 依存関係のインストール
```bash
# メインプロジェクト
pnpm install

# MCPサーバー
cd mcp-server
pnpm install
cd ..
```

#### 3. 環境変数の設定
```bash
# .env.local ファイルを作成
cp .env.example .env.local
```

以下の環境変数を設定します。
```env
# Qdrant設定
QD_URL=http://localhost:6333
QD_API_KEY=your_qdrant_api_key

# Nomic AI設定
NOMIC_API_KEY=your_nomic_api_key

# Ollama設定
OLLAMA_BASE_URL=http://localhost:11434

# 環境設定
NEXT_PUBLIC_ENVIRONMENT=development
```

#### 4. Ollamaのセットアップ
```bash
# Ollamaをインストール（macOS）
brew install ollama

# Ollamaサービス開始
ollama serve

# 必要なモデルをダウンロード
ollama pull llama2:7b
ollama pull codellama:7b
```

#### 5. Qdrantのセットアップ
```bash
# Dockerを使用する場合
docker run -p 6333:6333 qdrant/qdrant

# または直接インストール
# https://qdrant.tech/documentation/quick-start/
```

#### 6. 開発サーバーの起動
```bash
# 開発モードで起動
pnpm dev

# または Makefileを使用
make dev
```

## プロジェクト構造

### ディレクトリ構成
```
Hackathon-AI/
├── docs/                     # ドキュメント
├── mcp-server/              # MCP サーバー
├── public/                  # 静的ファイル
├── src/
│   ├── adapters/           # 外部サービスアダプター
│   ├── app/                # Next.js App Router
│   │   ├── (dashboard)/    # ダッシュボードページ
│   │   └── globals.css     # グローバルスタイル
│   ├── components/         # Reactコンポーネント
│   │   ├── ui/            # UIコンポーネント
│   │   └── __tests__/     # コンポーネントテスト
│   ├── factories/          # ファクトリーパターン
│   ├── hooks/              # カスタムフック
│   ├── interfaces/         # TypeScript インターフェース
│   ├── lib/                # ユーティリティ・ライブラリ
│   ├── middleware.ts       # Next.js ミドルウェア
│   ├── pages/              # API ルート
│   │   └── api/           # APIエンドポイント
│   ├── scripts/            # ユーティリティスクリプト
│   └── types/              # 型定義
├── __tests__/              # 統合テスト
├── vitest.config.ts        # テスト設定
├── tailwind.config.ts      # Tailwind設定
├── tsconfig.json           # TypeScript設定
└── package.json            # 依存関係・スクリプト
```

### アーキテクチャパターン

#### 1. レイヤードアーキテクチャ
```
Presentation Layer (React Components)
    ↓
API Layer (Next.js API Routes)
    ↓
Business Logic Layer (Services/Agents)
    ↓
Data Access Layer (Adapters)
    ↓
External Services (Ollama, Qdrant, Nomic)
```

#### 2. ファクトリーパターン
```typescript
// factories/qdrantHandler.factory.ts
export class QdrantHandlerFactory {
  static createDefault(): QdrantHandler {
    return new QdrantHandler(
      process.env.QD_URL!,
      process.env.QD_API_KEY!
    );
  }
  
  static createWithConfig(config: QdrantConfig): QdrantHandler {
    return new QdrantHandler(config.url, config.apiKey);
  }
}
```

#### 3. アダプターパターン
```typescript
// adapters/ollama.adapter.ts
export class OllamaAdapter implements LLMAdapter {
  async generateText(prompt: string): Promise<string> {
    // Ollama固有の実装
  }
}
```

## 開発ワークフロー

### 1. 機能開発フロー

#### ブランチ戦略
```bash
# 機能ブランチの作成
git checkout -b feature/new-feature-name

# 開発作業
# ... コーディング ...

# テスト実行
pnpm test

# 型チェック
pnpm typecheck

# フォーマット
pnpm format

# リント
pnpm lint

# コミット
git add .
git commit -m "feat: add new feature description"

# プッシュ
git push origin feature/new-feature-name
```

#### コミットメッセージ規約
```
type(scope): description

type: feat, fix, docs, style, refactor, test, chore
scope: api, ui, lib, test, etc.

例:
feat(api): add new idea generation endpoint
fix(ui): resolve button alignment issue
docs: update API documentation
test(lib): add unit tests for qdrant handler
```

### 2. テスト駆動開発 (TDD)

#### Red-Green-Refactor サイクル
```typescript
// 1. Red: 失敗するテストを書く
describe('IdeaAgent', () => {
  it('should generate idea from prize', async () => {
    const agent = new IdeaAgent();
    const result = await agent.generateFromPrize('AI賞');
    expect(result).toHaveProperty('content');
    expect(result.content).toContain('AI');
  });
});

// 2. Green: 最小限の実装でテストを通す
export class IdeaAgent {
  async generateFromPrize(prize: string): Promise<{content: string}> {
    return { content: `${prize}に関するアイデア` };
  }
}

// 3. Refactor: コードを改善
export class IdeaAgent {
  async generateFromPrize(prize: string): Promise<GenerationResult> {
    const context = await this.buildContext(prize);
    const prompt = this.buildPrompt(prize, context);
    const result = await this.llmAdapter.generate(prompt);
    return this.parseResult(result);
  }
}
```

### 3. パフォーマンス最適化フロー

#### プロファイリング
```typescript
// lib/performance.ts を使用
const monitor = PerformanceMonitor.getInstance();

const { result, duration } = await timeOperation(
  'database_query',
  () => qdrantHandler.search(query)
);

monitor.recordMetrics({
  queryTime: duration,
  resultCount: result.length
});
```

## コーディング規約

### 1. TypeScript スタイル

#### 型定義
```typescript
// 明示的な型定義を推奨
interface UserRequest {
  readonly id: string;
  idea: string;
  metadata?: RequestMetadata;
}

// ユニオン型の活用
type Status = 'pending' | 'processing' | 'completed' | 'error';

// ジェネリクスの活用
interface ApiResponse<T> {
  data: T;
  status: Status;
  timestamp: Date;
}
```

#### 関数定義
```typescript
// アロー関数を基本とする
const processIdea = async (
  idea: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> => {
  // 実装
};

// 型ガードの活用
const isValidIdea = (input: unknown): input is string => {
  return typeof input === 'string' && input.length > 0;
};
```

### 2. React コンポーネント

#### 関数コンポーネント
```typescript
// props の型定義
interface IdeaFormProps {
  onSubmit: (idea: string) => void;
  isLoading?: boolean;
  initialValue?: string;
}

// デフォルトpropsの使用
const IdeaForm: React.FC<IdeaFormProps> = ({
  onSubmit,
  isLoading = false,
  initialValue = ''
}) => {
  // 実装
};
```

#### カスタムフック
```typescript
// hooks/useIdeaSubmission.ts
export const useIdeaSubmission = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const submitIdea = useCallback(async (idea: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.submitIdea(idea);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { submitIdea, isLoading, error };
};
```

### 3. エラーハンドリング

#### カスタムエラークラス
```typescript
// lib/errors.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}
```

#### エラー処理パターン
```typescript
// 結果型パターン
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const safeParseJson = <T>(json: string): Result<T> => {
  try {
    const data = JSON.parse(json);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};
```

## テスト戦略

### 1. テストの種類

#### ユニットテスト
```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeString, validateEmail } from '@/lib/utils';

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeString(input);
    expect(result).toBe('Hello');
  });
  
  it('should preserve valid text', () => {
    const input = 'Valid text content';
    const result = sanitizeString(input);
    expect(result).toBe(input);
  });
});
```

#### 統合テスト
```typescript
// __tests__/api/search-ideas.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/search-ideas';

describe('/api/search-ideas', () => {
  it('should return search results', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { idea: 'blockchain voting system' }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('projects');
    expect(Array.isArray(data.projects)).toBe(true);
  });
});
```

#### E2Eテスト
```typescript
// __tests__/e2e/idea-flow.test.ts
import { test, expect } from '@playwright/test';

test('complete idea generation flow', async ({ page }) => {
  await page.goto('/');
  
  // アイデア入力
  await page.fill('[data-testid="idea-input"]', 'AI-powered music generator');
  await page.click('[data-testid="submit-button"]');
  
  // 結果の確認
  await expect(page.locator('[data-testid="results"]')).toBeVisible();
  await expect(page.locator('[data-testid="similar-projects"]')).toContainText('projects');
});
```

### 2. テスト実行

#### 基本コマンド
```bash
# 全テスト実行
pnpm test

# ウォッチモード
pnpm test:watch

# カバレッジ付き実行
pnpm test:coverage

# UI テストランナー
pnpm test:ui
```

#### CI/CD パイプライン
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm typecheck
      - run: pnpm lint
```

## パフォーマンス最適化

### 1. フロントエンド最適化

#### コンポーネント最適化
```typescript
// React.memo の活用
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// 動的インポート
const LazyIdeaForm = lazy(() => import('@/components/IdeaForm'));
```

#### バンドル最適化
```typescript
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
```

### 2. バックエンド最適化

#### データベース最適化
```typescript
// キャッシュ戦略
class QdrantHandler {
  private embeddingCache = new Map<string, number[]>();
  
  async createEmbedding(text: string): Promise<number[]> {
    const cacheKey = hashString(text);
    
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }
    
    const embedding = await this.nomicAdapter.createEmbedding(text);
    this.embeddingCache.set(cacheKey, embedding);
    
    return embedding;
  }
}
```

#### API最適化
```typescript
// レスポンス圧縮
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // gzip 圧縮の有効化
  res.setHeader('Content-Encoding', 'gzip');
  
  // キャッシュヘッダーの設定
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  
  // データ返却
  return res.json(data);
}
```

## デバッグ方法

### 1. ログ設定

#### ログレベル設定
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

export default logger;
```

#### デバッグログの活用
```typescript
// デバッグ用のログ
logger.debug('Processing idea', { 
  ideaLength: idea.length,
  timestamp: Date.now()
});

// パフォーマンス測定
const startTime = Date.now();
const result = await expensiveOperation();
logger.performanceLog('Expensive operation', Date.now() - startTime);
```

### 2. 開発ツール

#### VS Code設定
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

#### ブラウザデバッグ
```typescript
// React Developer Tools の活用
// Performance profiler の使用
// Network tab でのAPI監視

// デバッグ用のグローバル変数
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAPI = {
    logger,
    performance: PerformanceMonitor.getInstance(),
    cache: embeddingCache
  };
}
```

## 貢献ガイドライン

### 1. プルリクエストの作成

#### チェックリスト
- [ ] テストが通ること
- [ ] 型チェックが通ること
- [ ] リントエラーがないこと
- [ ] ドキュメントが更新されていること（API の変更や新機能追加時）
- [ ] 破壊的変更がある場合は MIGRATION.md に記載

#### PRテンプレート
```markdown
## 概要
<!-- 変更内容の簡潔な説明 -->

## 変更内容
- [ ] 新機能の追加
- [ ] バグ修正
- [ ] パフォーマンス改善
- [ ] ドキュメント更新

## テスト
<!-- テスト方法と結果 -->

## 影響範囲
<!-- この変更が影響する部分 -->

## 追加情報
<!-- その他の情報 -->
```

### 2. イシューの報告

#### バグレポート
```markdown
## バグの説明
<!-- 何が起こったかの詳細 -->

## 再現手順
1. 
2. 
3. 

## 期待される動作
<!-- 何が起こるべきだったか -->

## 環境
- OS: 
- Node.js version: 
- Browser: 
```

#### 機能要求
```markdown
## 機能の説明
<!-- 要求する機能の詳細 -->

## 動機
<!-- なぜこの機能が必要か -->

## 代替案
<!-- 考えられる他の解決方法 -->
```

### 3. コードレビュー

#### レビューポイント
- セキュリティ: 入力検証、認証、権限チェック
- パフォーマンス: 計算量 O(n)以下のアルゴリズム、メモリ使用量 1GB 以下
- 可読性: 命名、コメント、構造
- 保守性: モジュール化、依存関係、テスタビリティ
- 品質: エラーハンドリング、エッジケース処理

#### レビューテンプレート
```markdown
## 良い点
- 

## 改善点
- 

## 質問・提案
- 

## 総合評価
LGTM / 要修正 / 要議論
```

これらのガイドラインに従うことで、高品質で保守性の高いコードベースを維持し、チーム全体でのスムーズな開発を実現できます。