import puppeteer from "puppeteer";
import cheerio from "cheerio";
import fs from "fs";

async function crawlEthGlobalShowcase() {
  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Navigate to the EthGlobal showcase page
  await page.goto("https://ethglobal.com/showcase");

  // Wait for the necessary content to load
  await page.waitForSelector(".project-card");

  // Get the page content
  const content = await page.content();

  // Load the content into Cheerio
  const $ = cheerio.load(content);

  // Extract the finalist projects
  const projects = [];
  $(".project-card").each((index, element) => {
    const isFinalist = $(element).find(".badge-finalist").length > 0;
    if (isFinalist) {
      const title = $(element).find(".project-title").text().trim();
      const link = $(element).find("a").attr("href");
      projects.push({ title, link });
    }
  });

  // Extract project details
  for (const project of projects) {
    try {
      await page.goto(`https://ethglobal.com${project.link}`);
      await page.waitForSelector(".project-description");
      const projectContent = await page.content();
      const $$ = cheerio.load(projectContent);
      project.description = $$(".project-description").text().trim();
    } catch (error) {
      console.error(
        `Failed to load project details for ${project.title}`,
        error,
      );
    }
  }

  // Close the browser
  await browser.close();

  // Save the data to a JSON file
  const outputPath = "./data/ethglobal_finalists.json";
  fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2));

  console.log(`Data has been saved to ${outputPath}`);
}

crawlEthGlobalShowcase().catch(console.error);
