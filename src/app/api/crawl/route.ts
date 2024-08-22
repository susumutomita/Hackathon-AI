import { NextRequest, NextResponse } from "next/server";
import { crawlEthGlobalShowcase } from "@/lib/crawler";

export async function GET(request: NextRequest) {
  const prompt = `
  Extract the following information from the provided HTML content:
  1. List of projects with the following details:
     - Project Title
     - Project Link
     - Prize information (Is the project a finalist?)
  `;

  try {
    const projects = await crawlEthGlobalShowcase(prompt);
    return NextResponse.json(
      { message: "Crawling completed successfully", projects },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Crawling failed",
        details: error.message || "An unknown error occurred",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  }
}
