"use client";
export async function fetchFinalists() {
  // ここでクローラーが生成したファイルやAPIからデータを取得
  // const response = await fetch("/path/to/ethglobal_finalists.json");
  // const data = await response.json();
  const finalists = [
    {
      title: "Project 1",
      link: "https://example.com/project1",
      description: "This is project 1 description.",
    },
    {
      title: "Project 2",
      link: "https://example.com/project2",
      description: "This is project 2 description.",
    },
  ];
  const data = finalists;
  return data;
}
