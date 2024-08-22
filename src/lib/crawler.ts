import axios from "axios";
import * as cheerio from "cheerio";
import logger from "@/lib/logger";

const finalistImageUrl =
  "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
const baseUrl = "https://ethglobal.com/showcase/page";
const eventFilter = "brussels,superhack2024,starkhack";

async function extractProjectDetails(html: string): Promise<any[]> {
  const $ = cheerio.load(html);
  const projects: Array<{
    title: string;
    description: string;
    prize: boolean;
    link: string;
    hackathon: string;
  }> = [];

  $(".block.border-2.border-black.rounded.overflow-hidden.relative").each(
    (index, element) => {
      const prize =
        $(element).find(`img[src="${finalistImageUrl}"]`).length > 0;

      if (prize) {
        const link = `${$(element).attr("href")}`;
        const title = $(element).find("h2").text().trim();
        const description = $(element).find("p").text().trim();
        const hackathon = $(element)
          .find(".inline-flex.overflow.font-semibold.items-center")
          .text()
          .trim();

        projects.push({ title, description, prize, link, hackathon });
      }
    },
  );
  console.log("Extracted project details:", JSON.stringify(projects, null, 2));

  return projects;
}

export async function crawlEthGlobalShowcase(prompt: string) {
  const allProjects: any[] = [];
  let page = 1;

  try {
    while (true) {
      console.log(`Crawling page ${page}...`);
      const url = `${baseUrl}/${page}?events=${eventFilter}`;
      console.log("Crawling URL:", url);
      const response = await axios.get(url);
      const showcaseHtml = response.data;

      if (showcaseHtml.includes("No results found...")) {
        logger.info("No more results found. Stopping crawl.");
        break;
      }

      const projectDetails = await extractProjectDetails(showcaseHtml);

      allProjects.push(...projectDetails);
      page++;
    }

    console.log(
      "Successfully crawled all pages and extracted finalist project details:",
      JSON.stringify(allProjects, null, 2),
    );
    return allProjects;
  } catch (error) {
    logger.error("Error during crawling and parsing:", error);
    return [];
  }
}
