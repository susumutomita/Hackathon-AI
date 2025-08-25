# Hackathon AI - コンポーネントカタログ

## 概要
このドキュメントでは、Hackathon AI プロジェクトで使用されている React コンポーネントのカタログを提供します。各コンポーネントの使用方法、プロパティ、使用例を詳細に説明します。

## アーキテクチャ

### コンポーネント構造
```
src/components/
├── ui/                     # 基本UIコンポーネント（Radix UI + Tailwind CSS）
│   ├── button.tsx         # ボタンコンポーネント。
│   ├── card.tsx           # カードコンポーネント。
│   ├── input.tsx          # 入力フィールド
│   ├── table.tsx          # テーブルコンポーネント。
│   ├── tabs.tsx           # タブコンポーネント。
│   ├── tooltip.tsx        # ツールチップ
│   ├── badge.tsx          # バッジ表示
│   ├── breadcrumb.tsx     # パンくずリスト
│   ├── dropdown-menu.tsx  # ドロップダウンメニュー
│   └── sheet.tsx          # サイドパネル
├── IdeaForm.tsx          # メインのアイデア入力フォーム
├── LazyIdeaForm.tsx      # 遅延読み込み版アイデアフォーム
├── ErrorBoundary.tsx     # エラー境界コンポーネント。
└── icons.tsx             # アイコンコンポーネント。
```

### デザインシステム
- UI Library: Radix UI（アクセシビリティ対応）
- Styling: Tailwind CSS（ユーティリティファースト）
- Icons: Lucide React（一貫性のあるアイコンセット）
- Typography: システムフォント + Web Safe フォント

## コアコンポーネント。

### 1. IdeaForm
メインのアイデア入力・検索フォームコンポーネント。

#### 機能
- アイデアの入力と検索
- 類似プロジェクトの表示
- AI による改善提案の生成
- リアルタイムバリデーション

#### 使用例
```jsx
import IdeaForm from '@/components/IdeaForm';

function App() {
  return (
    <div>
      <IdeaForm />
    </div>
  );
}
```

#### 主要な状態
```typescript
interface IdeaFormState {
  idea: string;                    // 入力されたアイデア
  results: Project[];              // 検索結果
  improvedIdea: string;            // 改善されたアイデア
  loading: boolean;                // ローディング状態
  searchStatus: string;            // 検索ステータス
}
```

#### アクセシビリティ機能
- スクリーンリーダー対応
- キーボードナビゲーション
- ARIA ラベル
- フォーカス管理

### 2. LazyIdeaForm
パフォーマンス最適化のための遅延読み込み版。

#### 使用例
```jsx
import { Suspense } from 'react';
import LazyIdeaForm from '@/components/LazyIdeaForm';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyIdeaForm />
    </Suspense>
  );
}
```

### 3. ErrorBoundary
エラーハンドリングのための境界コンポーネント。

#### 使用例
```jsx
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### プロパティ
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error}>;
}
```

## UIコンポーネント。

### 1. Button
多様なスタイルとサイズに対応したボタンコンポーネント。

#### バリアント
- `default`: プライマリーボタン
- `destructive`: 危険なアクションボタン
- `outline`: アウトラインボタン
- `secondary`: セカンダリーボタン
- `ghost`: ゴーストボタン
- `link`: リンクスタイルボタン

#### サイズ
- `default`: 標準サイズ (h-10)
- `sm`: 小サイズ (h-9)
- `lg`: 大サイズ (h-11)
- `icon`: アイコン専用 (h-10 w-10)

#### 使用例
```jsx
import { Button } from '@/components/ui/button';

// 基本的な使用
<Button>Click me</Button>

// バリアント指定
<Button variant="destructive">Delete</Button>

// サイズ指定
<Button size="lg">Large Button</Button>

// 無効化状態
<Button disabled>Disabled</Button>

// ローディング状態
<Button disabled={loading}>
  {loading ? 'Loading...' : 'Submit'}
</Button>
```

#### プロパティ
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

### 2. Card
コンテンツをグループ化するカードコンポーネント。

#### 構成要素
- `Card`: ベースコンテナ
- `CardHeader`: ヘッダー部分
- `CardTitle`: タイトル
- `CardDescription`: 説明文
- `CardContent`: メインコンテンツ
- `CardFooter`: フッター部分

#### 使用例
```jsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>プロジェクト概要</CardTitle>
    <CardDescription>
      このプロジェクトの詳細について説明します
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>メインコンテンツがここに入ります</p>
  </CardContent>
  <CardFooter>
    <Button>詳細を見る</Button>
  </CardFooter>
</Card>
```

### 3. Table
データ表示用のテーブルコンポーネント。

#### 構成要素
- `Table`: ベーステーブル
- `TableHeader`: ヘッダー行
- `TableBody`: ボディ部分
- `TableRow`: 行
- `TableHead`: ヘッダーセル
- `TableCell`: データセル

#### 使用例
```jsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>プロジェクト名</TableHead>
      <TableHead>説明</TableHead>
      <TableHead>ステータス</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {projects.map((project) => (
      <TableRow key={project.id}>
        <TableCell>{project.name}</TableCell>
        <TableCell>{project.description}</TableCell>
        <TableCell>{project.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 4. Input
フォーム入力用のインプットコンポーネント。

#### 使用例
```jsx
import { Input } from '@/components/ui/input';

// 基本的な使用
<Input type="text" placeholder="アイデアを入力..." />

// バリデーションエラー時
<Input 
  type="email" 
  placeholder="email@example.com"
  className={errors.email ? 'border-red-500' : ''}
/>

// 無効化状態
<Input disabled placeholder="無効化されています" />
```

#### プロパティ
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: string;
  className?: string;
}
```

### 5. Badge
ステータスやカテゴリ表示用のバッジコンポーネント。

#### バリアント
- `default`: デフォルトスタイル
- `secondary`: セカンダリースタイル
- `destructive`: エラー/警告用
- `outline`: アウトラインスタイル

#### 使用例
```jsx
import { Badge } from '@/components/ui/badge';

<Badge>新着</Badge>
<Badge variant="secondary">進行中</Badge>
<Badge variant="destructive">エラー</Badge>
<Badge variant="outline">下書き</Badge>
```

### 6. Tabs
タブ切り替え UI コンポーネント。

#### 構成要素
- `Tabs`: ベースコンテナ
- `TabsList`: タブリスト
- `TabsTrigger`: タブボタン
- `TabsContent`: タブコンテンツ

#### 使用例
```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">概要</TabsTrigger>
    <TabsTrigger value="details">詳細</TabsTrigger>
    <TabsTrigger value="settings">設定</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    概要コンテンツ
  </TabsContent>
  <TabsContent value="details">
    詳細コンテンツ
  </TabsContent>
  <TabsContent value="settings">
    設定コンテンツ
  </TabsContent>
</Tabs>
```

### 7. Tooltip
ヘルプテキスト表示用のツールチップ。

#### 使用例
```jsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>ヘルプ</TooltipTrigger>
    <TooltipContent>
      <p>ここに説明文が表示されます</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## カスタムフック

### 1. useFormValidation
フォームバリデーション用のカスタムフック。

#### 使用例
```tsx
import { useFormValidation } from '@/hooks/useFormValidation';

function MyForm() {
  const { errors, validateField, clearErrors } = useFormValidation();
  
  const handleSubmit = (data) => {
    const validation = validateField('email', data.email);
    if (!validation.isValid) {
      // エラーハンドリング
      return;
    }
    // 処理続行
  };
}
```

#### 返り値
```typescript
interface FormValidationReturn {
  errors: Record<string, string>;
  validateField: (field: string, value: string) => ValidationResult;
  clearErrors: () => void;
}
```

### 2. useCSRF
CSRF 保護用のカスタムフック。

#### 使用例
```tsx
import { useCSRF } from '@/hooks/useCSRF';

function SecureForm() {
  const { token, isLoading } = useCSRF();
  
  const handleSubmit = async (data) => {
    const response = await fetch('/api/endpoint', {
      headers: {
        'X-CSRF-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  };
}
```

## スタイリングガイドライン

### 1. Tailwind CSS クラス

#### 色彩システム
```css
/* プライマリーカラー */
.text-primary          /* メインテキスト */
.bg-primary           /* メイン背景 */
.border-primary       /* メインボーダー */

/* セカンダリーカラー */
.text-secondary       /* セカンダリーテキスト */
.bg-secondary         /* セカンダリー背景 */

/* 状態色 */
.text-destructive     /* エラー・警告 */
.text-muted-foreground /* 非活性テキスト */
```

#### レスポンシブデザイン
```css
/* ブレイクポイント */
sm: '640px'           /* タブレット */
md: '768px'           /* 小さなデスクトップ */
lg: '1024px'          /* デスクトップ */
xl: '1280px'          /* 大きなデスクトップ */
2xl: '1536px'         /* 超大画面 */
```

### 2. カスタムCSS変数
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

## アクセシビリティ対応

### 1. ARIA属性の使用
```jsx
// ロール属性
<div role="button" tabIndex={0}>カスタムボタン</div>

// 状態属性
<button aria-expanded={isOpen}>メニュー</button>

// ラベル属性
<input aria-label="検索キーワード" />

// 説明属性
<input aria-describedby="help-text" />
<div id="help-text">入力のヘルプテキスト</div>
```

### 2. キーボードナビゲーション
```jsx
const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    handleClick();
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
>
  クリッカブル要素
</div>
```

### 3. フォーカス管理
```jsx
import { useRef, useEffect } from 'react';

function Modal({ isOpen }) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);
  
  return (
    <div ref={modalRef} tabIndex={-1}>
      モーダルコンテンツ
    </div>
  );
}
```

## パフォーマンス最適化

### 1. コンポーネントの最適化
```jsx
import { memo, useCallback, useMemo } from 'react';

// React.memo でメモ化
const OptimizedComponent = memo(function Component({ data }) {
  // useMemo で重い計算をメモ化
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  // useCallback でコールバックをメモ化
  const handleClick = useCallback(() => {
    // イベントハンドラー
  }, []);
  
  return <div>{processedData}</div>;
});
```

### 2. 遅延読み込み
```jsx
import { lazy, Suspense } from 'react';

// コンポーネントの遅延読み込み
const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 3. 仮想化
```jsx
// 大量データの仮想化（react-window使用例）
import { FixedSizeList as List } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={35}
    >
      {Row}
    </List>
  );
}
```

## テスト戦略

### 1. コンポーネントテスト
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### 2. アクセシビリティテスト
```jsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<YourComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Storybookの導入検討

### 1. 設定例
```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
};
```

### 2. ストーリー例
```jsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Hackathon AI の基本ボタンコンポーネント',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};
```

## 今後の改善計画

### 1. 短期目標（1-3ヶ月）
- [ ] Storybook の導入
- [ ] アクセシビリティテストの自動化
- [ ] パフォーマンス監視の強化
- [ ] ダークモードサポート

### 2. 中期目標（3-6ヶ月）
- [ ] デザイントークンシステムの実装
- [ ] アニメーションライブラリの統合
- [ ] 国際化（i18n）対応
- [ ] PWA 機能の追加

### 3. 長期目標（6ヶ月以上）
- [ ] Web Components 対応
- [ ] マイクロフロントエンド対応
- [ ] AI 支援のコンポーネント生成
- [ ] リアルタイムコラボレーション機能

このコンポーネントカタログは、開発チームがコンポーネントを効率的に理解し、再利用するためのリファレンスとして活用してください。新しいコンポーネントの追加や既存コンポーネントの更新時は、このドキュメントも併せて更新をお願いします。