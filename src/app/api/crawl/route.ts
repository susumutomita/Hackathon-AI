import { NextRequest, NextResponse } from "next/server";
import { crawlEthGlobalShowcase } from "./crawler";

export async function GET(request: NextRequest) {
  try {
    const projects = await crawlEthGlobalShowcase();
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
      { error: "Crawling failed", details: error.message },
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
