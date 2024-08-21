import axios from "axios";
import { load } from "cheerio"; // 名前付きインポート
import { Project } from "@/types";

export async function crawlEthGlobalShowcase() {
  try {
    const response = await axios.get("https://ethglobal.com/showcase");
    const html = response.data;
    console.log("Crawled HTML:", html);
    const $ = load(html);

    const projects: Project[] = [];
    $(".project-card").each((index, element) => {
      const isFinalist = $(element).find(".badge-finalist").length > 0;
      if (isFinalist) {
        const title = $(element).find(".project-title").text().trim();
        const link = $(element).find("a").attr("href");
        if (link) {
          projects.push({ title, link, description: "" });
        }
      }
    });

    for (const project of projects) {
      try {
        const projectPageResponse = await axios.get(
          `https://ethglobal.com${project.link}`,
        );
        const projectPageHtml = projectPageResponse.data;
        const $$ = load(projectPageHtml);
        project.description = $$(".project-description").text().trim();
      } catch (error) {
        console.error(
          `Failed to load project details for ${project.title}`,
          error,
        );
      }
    }

    // データをコンソールに表示
    console.log("Crawled Projects:", projects);

    // 取得したデータをJSON形式で返す
    return projects;
  } catch (error) {
    console.error("Crawling failed", error);
    throw error;
  }
}
