// import { getCrawledData } from "./getCrawledData";

export async function searchIdeas(idea: string) {
  const data = ["hogehgoge"]; // クローラーからのデータを取得
  // 簡易的な検索ロジック（実際にはLLMを使うか、より高度なアルゴリズムを使用）
  return data.filter((item) =>
    item.title.toLowerCase().includes(idea.toLowerCase()),
  );
}
