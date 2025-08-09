# Hackathon AI UX仕様書

最終更新: 2025-08-09
作成対象: 本リポジトリ（Next.js App Router + Tailwind 3.4 + Radix/shadcn UI）

## 1. プロダクト概要

- 目的: 過去ハッカソンの事例を活用し、ユーザーのプロジェクトアイデアを短時間で改善する。
- 中核機能: アイデア入力 → 類似プロジェクト探索 → 改善案生成 → 結果参照/次アクション。
- 現状の構成: `src/app/(dashboard)/page.tsx` を起点に `src/components/IdeaForm.tsx`、結果表示は `ui/table`。

## 2. 目標と指標（North Star, Success Metrics）

- 北極星指標: 初回改善案到達率（初回訪問で改善案が表示される割合）
- 成果指標:
  - TTFI（Time to First Improved idea）: ≤ 15 秒（80 パーセンタイル）
  - Suggestion Adoption: 改善案のコピー/保存率 ≥ 40%
  - Similarity Hit Rate: 類似 PJ が 1 件以上表示されるセッション率 ≥ 70%
  - Error-Free Rate: API/UX エラーのない送信率 ≥ 98%
  - 回遊: 類似 PJ リンクの外部遷移率 ≥ 25%

## 3. ペルソナ

- 学生ハッカー: アイデア組み立て初期、スピード最優先。モバイル利用多め。
- 社会人ビルダー: 技術選定と差別化の確認。デスクトップ中心。
- メンター/主催者（将来）: 成功パターン分析、評価補助（本範囲外）。

## 4. UX原則（Design Principles）

- ミニマル: ノイズを減らし、内容と行動導線を最優先。
- タイポ重視: 見出し/本文の階層を明確化。読みやすい行間/列幅。
- 一貫性: デザイントークン駆動（色/余白/半径/影/フォーカス）。
- アクセシビリティ: WCAG 2.1 AA、フォーカス可視、キーボード操作完備。
- レスポンシブ: 8px グリッド、主要ブレークポイントで密度最適化。

## 5. 情報設計（IA）/ ナビゲーション

- 主要ビュー:
  - ダッシュボード（既存）: アイデア入力 + 改善案表示 + 類似 PJ 一覧（同一画面 2 カラム + テーブル）
  - 設定（将来）: 言語/テーマ（ライト/ダーク）/履歴保存のオプション
  - 履歴（将来）: 送信アイデア/改善案/クリックログ
- ナビ: ヘッダにトップ/履歴/設定（モバイルは `Sheet` に格納）。

## 6. 主要フロー（As-Is → To-Be）

- As-Is: アイデア入力 → 送信 → ローディング文言 → 改善案/類似 PJ 表示。
- To-Be（改善点）:
  1) 入力エリアの情報支援（プレースホルダー例/最小要件ヒント）。
  2) 送信後はスケルトン表示（改善案/テーブル双方）+ 進捗サブテキスト。
  3) 改善案のクイック操作（コピー/保存/再生成）。
  4) 類似 PJ の外部リンクは外部遷移アイコン/新規タブ/安全な URL サニタイズ（既存の `sanitizeUrl` を継続）。
  5) 空/エラー状態の明確化（アクション提案付き）。

## 7. 画面仕様（States & Interactions）

### 7.1 アイデア入力（IdeaForm 左カラム）

- 入力: `react-textarea-autosize`。最小行 10、ガイド文付与。
- バリデーション: 既存 `useFormValidation` を使用。エラーは赤系トーン+説明文。
- アクション:「Submit」主要 CTA。Loading 時は非活性 + スピナー/進捗文。
- ヘルプ: プレースホルダーに「ターゲット/主要機能/差別化」を例示。

状態。

- Idle: フォーカスリング明確、説明文は `muted-foreground`。
- Loading: スケルトン（見出し/段落風ブロック 2–3）。
- Error: バナー（destructive）+ 再試行ガイダンス。

### 7.2 改善案（IdeaForm 右カラム）

- 表示: 読み取り専用テキストエリア（編集可切替は将来）。
- 操作: Copy（クリップボード）、Regenerate（再生成）、Save（将来）。
- 説明: 改善方針の簡易注釈（何を根拠に改善したか）。

状態。

- Empty: 提示メッセージ（送信を促す）。
- Loading: スケルトン（段落）。
- Ready: アクション群表示、成功トースト。

### 7.3 類似プロジェクト一覧（Table）

- 列: Title / Project Description / How it’s Made / Source Code。
- 行: hover 強調、キーボードフォーカス可視。
- リンク: 外部遷移アイコン、`rel="noopener noreferrer"`、URL サニタイズ。
- 空/エラー: 空状態カード、エラー時は再試行リンク。

### 7.4 モバイルナビ（Sheet）

- 主要リンク: Dashboard / History（将来）/ Settings（将来）。
- アクセシビリティ: `role=dialog` と `aria-label`、トリガーは `aria-controls` 設定。

## 8. コンポーネント仕様（Variants 概要）

- Button: ```size {sm, md, lg} tone {primary, neutral, destructive} state {hover, focus, disabled loading}```
- Input/Textarea: ラベル/ヘルプ/エラー文、`aria-describedby` 一貫。
- Card: ヘッダ/本文/フッタスロット、陰影の段階。
- Table: sticky header、行ホバー、リンク強調。
- Tooltip/Toast/Modal/Sheet/Tabs: Radix/shadcn パターンに準拠。

## 9. デザイントークン（実装前提）

- 実装位置: `src/app/globals.css`（:root/.dark）、`tailwind.config.ts`（bridge）。
- 必須トークン: `--background --foreground --primary --secondary --muted --accent --destructive --border --input --ring --radius`
- 補助トークン（提案）:
  - 間隔: `--space-1..8`（8px 単位運用の補助。Tailwind spacing と合わせて運用）
  - 影: `--shadow-1..3`（微小→中程度）
- ブランドアクセント: 未確定（HEX の指定が必要）。デフォルトは現行 `--primary` を使用しつつ、`--accent` をブランド色に割当予定。

## 10. レスポンシブ/レイアウト

- コンテナ: `container` center, padding 2rem, `2xl: 1400px`。
- ブレークポイント: sm/md/lg/xl/2xl（Tailwind デフォルト）。
- 密度: 快適/標準/高密度（トークン切替で余白/行高調整可能）。
- 2 カラム閾値: `lg:` で 2 カラム、それ未満は縦並び。

## 11. アクセシビリティ

- コントラスト: AA 準拠（主要テキスト ≥ 4.5:1、ボタンテキスト ≥ 4.5:1）。
- フォーカス: `:focus-visible` で `--ring` を統一適用。
- Live Region: 既存 `#search-status` を継続（polite/atomic）。
- キーボード操作: フォーム/テーブル/ナビへ Tab 移動、Esc で Sheet 閉。
- スクリーンリーダー: `sr-only` と対になる `.focus:not-sr-only` を適切運用。

## 12. コンテンツ/トーン

- 言語: 英語 UI を基調、日本語補助（プロジェクト方針に合わせ切替）。
- トーン: テック/プロフェッショナル/前向き。余計な擬音や曖昧表現は避ける。
- マイクロコピー例:
  - Submit: "Generate suggestions"
  - Loading: "Analyzing similar projects..."
  - Empty: "Submit your idea to see similar finalists."
  - Error: "Something went wrong. Please try again."

## 13. 非機能/品質基準

- パフォーマンス: LCP 主要画面 ≤ 2.5s、CLS=0、JS 追加依存なし（原則）。
- 安全性: URL サニタイズ/エスケープ（既存 `sanitizeUrl`/`escapeHtmlAttribute` 継続）。
- 回帰: DOM 構造変更は必要最小限、スナップショット差分は見た目のみ。

## 14. テレメトリ（将来の計測）

- Events:
  - ```idea_submitted`, `improved_generated`, `result_click`, `copy_improved_idea`, `api_error````
- Params: 入力長、結果件数、所要時間、デバイス、テーマ。

## 15. リスクと対策

- アクセント色のコントラスト不足 → 導入時に AA 検証必須、代替階調用意。
- ローディングが長い場合の離脱 → 進捗可視化/スケルトン/再試行提示。
- モバイルでのテーブル視認性 → カラム優先度/折返し/横スクロールガイド。

## 16. ロードマップ（実装順）

1) トークン統一（gray 系ユーティリティの置換、フォーカスリング統一）
2) スケルトン/空/エラーの状態導入（IdeaForm/テーブル）
3) モバイルナビ整理（Sheet 内に主要項目）
4) 改善案アクション（コピー/トースト）と導線最適化
5) 余白/行間/見出しスケールの微調整（密度 3 段階の下地）

## 17. 実装対象ファイル（初期スコープ）

- `src/app/globals.css`: :root/.dark の配色/影/半径/フォーカス調整
- `tailwind.config.ts`: tokens-first bridge の見直し
- `src/components/IdeaForm.tsx`: gray ユーティリティ→トークン置換、状態 UI 導入
- `src/app/(dashboard)/layout.tsx`: ナビ項目の配置/余白の整合

## 18. 受入基準（Acceptance Criteria）

- コントラスト AA、フォーカス可視、キーボード操作完備。
- ダーク/ライトで意味論が一致、切替が即時反映。
- `text-gray*/border-gray*` → トークン（`muted-foreground`/`input`/`border` 等）置換率 ≥ 95％。
- ローディング/空/エラーが再現可能で、UI 上で明確に区別可能。
- 既存機能/挙動は維持、視覚差分のみ。

## 19. セルフリフレクション（レビュー手順）

1) Heuristic Check（10 分）: 致命/警告/気づきに分類。
2) Contrast Check: 主要テキスト/ボタン/リンクの比率を列挙（AA/AAA 判定）。
3) State Audit: Loading/Empty/Error/Disabled/Focus の画面キャプチャ/仕様を一覧化。
4) Iteration: 重要度上位 3 件を修正した v1.1 を提示（差分/理由を明記）。
5) Risk Note: CLS/回帰リスクと予防策を記載。
6) Handoff: 実装 TODO（ファイル/行/クラス置換）と所要時間の見積もり。

## 20. オープン事項（要入力）

- ブランドアクセントカラー（HEX）: 例) `#4F46E5`（Indigo）/ `#22C55E`（Green）/ `#06B6D4`（Cyan）
- 参考 UI/ベンチマーク URL:（任意）
- 主要言語のデフォルト:（英語/日本語）

---
この仕様は実装ドライバ（トークン統一 → 状態 UI 導入 → ナビ整理）として最小の手戻りで進められるよう設計しています。アクセントカラー確定後、トークン更新から着手します。
