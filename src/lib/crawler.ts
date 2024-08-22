import axios from "axios";
import * as cheerio from "cheerio";
import logger from "@/lib/logger";
import { Project } from "@/types";

const finalistImageUrl =
  "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
const baseUrl = "https://ethglobal.com/showcase/page";
const eventFilter = "brussels";

async function extractProjectDetails(html: string): Promise<Project[]> {
  const $ = cheerio.load(html);
  const projects: Project[] = [];

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

  logger.info("Extracted project details:", JSON.stringify(projects, null, 2));

  return projects;
}

async function fetchProjectDetailPage(url: string): Promise<Partial<Project>> {
  try {
    logger.info(`Fetching details from ${url}...`);
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const sourceCode = $('a:contains("Source Code")').attr("href") || "";
    const projectDescription = $('h3:contains("Project Description")')
      .next("div.text-black-500")
      .text()
      .trim();
    const howItsMade = $('h3:contains("How it\'s Made")')
      .next("div.text-black-500")
      .text()
      .trim();

    return { sourceCode, projectDescription, howItsMade };
  } catch (error) {
    logger.error(`Failed to fetch details from ${url}:`, error);
    return {};
  }
}

export async function crawlEthGlobalShowcase(prompt: string) {
  const allProjects: Project[] = [];
  let page = 1;

  try {
    while (true) {
      logger.info(`Crawling page ${page}...`);
      const url = `${baseUrl}/${page}?events=${eventFilter}`;
      logger.info("Crawling URL:", url);
      const response = await axios.get(url);
      const showcaseHtml = response.data;

      if (showcaseHtml.includes("No results found...")) {
        logger.info("No more results found. Stopping crawl.");
        break;
      }

      const projectDetails = await extractProjectDetails(showcaseHtml);

      for (const project of projectDetails) {
        const projectDetailPageUrl = `https://ethglobal.com${project.link}`;
        const additionalDetails =
          await fetchProjectDetailPage(projectDetailPageUrl);
        Object.assign(project, additionalDetails);
      }

      allProjects.push(...projectDetails);
      page++;
    }

    logger.info(
      "Crawling completed successfully. Finalist project details extracted:",
      JSON.stringify(allProjects, null, 2),
    );
    return allProjects;
  } catch (error) {
    logger.error("Error occurred during crawling and parsing:", error);
    return [];
  }
}
