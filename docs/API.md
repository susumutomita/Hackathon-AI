# Hackathon AI - API ドキュメント

## 概要

Hackathon AI の Web API ドキュメントです。過去プロジェクトデータの収集は API では提供せず、リポジトリ管理の JSON をターミナルから更新します。

データ更新とローカル Agent の実行方法は [Local Agent Workflow](LOCAL_AGENT.md) を参照してください。

## ベース URL

```text
http://localhost:3000/api
```

## 主な API エンドポイント

### `POST /api/generate-idea`

賞金カテゴリーに基づいてアイデアを生成します。

### `POST /api/generate-winning-idea`

過去プロジェクトを参照してアイデアを生成します。

### `POST /api/improve-idea`

既存アイデアの改善案を生成します。

### `POST /api/search-ideas`

類似プロジェクトを検索します。

### `POST /api/update-events`

ETHGlobal のイベント情報を更新します。プロジェクト本体のクロールは行いません。

### `GET /api/csrf-token`

CSRF 保護用トークンを取得します。

## データ更新

`/api/crawl` と `/api/auto-crawl` は廃止しました。プロジェクトデータの正本は `data/projects.json` です。

```bash
pnpm data:crawl
pnpm data:index-local
```

通常の Agent 評価では Web API、Qdrant、クラウド LLM API は不要です。

```bash
pnpm agent:local examples/local-prize.json
```

## 共通 HTTP ステータス

- `200` - 成功
- `400` - バリデーションエラー
- `405` - 許可されていない HTTP メソッド
- `429` - レート制限
- `500` - サーバーエラー

## セキュリティ

入力値は各 API の Zod スキーマで検証します。ローカル Agent 実行では `LOCAL_ONLY_LLM=true` が強制され、Ollama の失敗時にクラウド LLM へフォールバックしません。
