# ETHGlobal Events 自動クロール設定

## 概要

このシステムは、ETHGlobal のイベントを自動的に検出し、新しいイベントがあれば自動的にクロールしてデータベースに追加します。

## 仕組み

1. イベント検出: ETHGlobal のサイトから最新のイベント一覧を取得
2. プルリクエスト作成: 新しいイベントが見つかった場合、自動的に PR を作成
3. AI レビュー: Claude AI が自動的に PR をレビュー
4. データベース更新: プロジェクトの重複を防ぐ upsert 処理で DB を更新
5. 定期実行: GitHub Actions で毎日自動実行

## 主な改善点

### 1. プルリクエスト方式

- 直接コミットではなく PR を作成することで、変更内容を確認可能
- AI による自動レビューで品質を保証
- 手動で有効化するイベントを選択可能

### 2. データベース重複対策

- プロジェクトのリンクを基にユニーク ID を生成
- 既存のプロジェクトは更新（upsert）され、重複登録を防止
- 最終更新日時を記録

## セットアップ

### 1. 環境変数の設定

GitHub Secrets に以下の環境変数を設定してください。

- `CRON_SECRET`: API エンドポイントへのアクセストークン
- `QD_URL`: Qdrant データベースの URL
- `QD_API_KEY`: Qdrant API キー
- `NOMIC_API_KEY`: Nomic Embeddings API キー

### 2. Vercel デプロイ設定

Vercel に同じ環境変数を設定してください。

### 3. 実行方法の選択

#### オプション1: GitHub Actions内で直接実行（推奨）

現在の実装では、GitHub Actions 内で直接スクリプトを実行します。
追加の設定は不要です。

#### オプション2: Vercel Webhookを使用

`crawledEvents.json`が更新されたときに、Vercel でクロールを実行したい場合。

1. Vercel Webhook URL を`VERCEL_WEBHOOK_URL` secret に設定
2. `.github/workflows/crawl-enabled-events.yml`が自動的にトリガー

## 使用方法

### 自動実行

- 毎日 UTC 0 時（日本時間 9 時）に自動実行
- GitHub Actions のワークフローページから手動実行も可能

### 手動実行

1. イベント更新のみ:

   ```bash
   curl -X POST https://your-app.vercel.app/api/update-events \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. イベント更新とクロール:

   ```bash
   curl -X POST https://your-app.vercel.app/api/auto-crawl \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### イベントの有効化

新しいイベントが検出されると、`crawledEvents.json`に`false`として追加されます。
クロールしたいイベントは手動で`true`に変更してください。

```json
{
  "unite": true,  // このイベントはクロールされる
  "newevent": false  // このイベントはクロールされない
}
```

## APIエンドポイント

### `/api/update-events`

- 最新のイベント一覧を取得し、新しいイベントを`crawledEvents.json`に追加

### `/api/auto-crawl`

- イベントの更新とクロールを一括実行

### `/api/crawl`

- 手動クロール用（開発環境のみ）

## トラブルシューティング

### イベントが更新されない

- ETHGlobal のサイト構造が変更されている可能性
- `src/lib/eventUpdater.ts`のセレクタを確認

### クロールが失敗する

- Qdrant データベースの接続を確認してください
- 環境変数が正しく設定されているか確認してください

### GitHub Actionsが失敗する

- Secrets が正しく設定されているか確認してください
- ワークフローのログを確認してエラーメッセージを特定してください
