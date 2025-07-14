# ハッカソンデータベース MCP サーバー設定ガイド

## 概要

ハッカソンプロジェクトのデータベース（Qdrant）を MCP（Model Context Protocol）サーバーとして公開しました。これにより、Claude Code やその他の MCP 対応アプリケーションからデータベースにアクセスできます。

## セットアップ

### 1. 依存関係のインストール

```bash
# MCPサーバーの依存関係をインストール
npm run mcp:install
```

### 2. MCPサーバーのビルド

```bash
# MCPサーバーをビルド
npm run mcp:build
```

### 3. 環境変数の設定

以下の環境変数が必要です。

- `QD_URL`: Qdrant サーバーのアドレス
- `QD_API_KEY`: Qdrant の API キー
- `NOMIC_API_KEY`: Nomic の埋め込み API キー

## Claude Codeでの使用方法

### 1. Claude Code設定ファイルの編集

`~/.claude/claude.json`に以下を追加します。

```json
{
  "mcpServers": {
    "hackathon-database": {
      "command": "node",
      "args": ["/path/to/HackathonAI/mcp-server/dist/index.js"],
      "env": {
        "QD_URL": "YOUR_QDRANT_URL",
        "QD_API_KEY": "YOUR_QDRANT_API_KEY",
        "NOMIC_API_KEY": "YOUR_NOMIC_API_KEY"
      }
    }
  }
}
```

### 2. Claude Codeの再起動

設定を反映するために Claude Code を再起動してください。

## 利用可能なツール

### search_projects

類似のハッカソンプロジェクトを検索します。

```bash
ツール名: search_projects
パラメータ:
- query (必須): 検索クエリ
- limit (オプション): 結果の最大数（デフォルト: 10）
```

使用例。
```bash
「NFTマーケットプレイス」に関連するプロジェクトを5件検索
```

### get_project（準備中）

特定のプロジェクトを ID で取得します。

## トラブルシューティング

### MCPサーバーが起動しない

1. 環境変数が正しく設定されているか確認
2. ビルドが成功しているか確認：`cd mcp-server && npm run build`
3. ログを確認：MCP サーバーは stderr にログを出力

### 検索結果が返ってこない

1. Qdrant サーバーが稼働しているか確認
2. API キーが有効か確認
3. ネットワーク接続を確認

## 開発

### ローカルでのテスト

```bash
cd mcp-server
npm run dev
```

### 新しいツールの追加

1. `mcp-server/src/index.ts`に新しいツールを追加
2. `qdrantClient.ts`にメソッドを追加
3. ビルドして動作確認

## 今後の機能

- プロジェクト ID による取得機能
- プロジェクトの追加・更新機能
- 統計情報の取得機能
