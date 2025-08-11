import "dotenv/config"; // .envファイルを読み込む
import { QdrantClient } from "@qdrant/js-client-rest";
import { getValidatedEnv } from "@/lib/env";

async function testConnection() {
  const env = getValidatedEnv();
  console.log("Qdrant URL:", env.QD_URL);
  console.log("API Key:", env.QD_API_KEY ? "Set (hidden)" : "Not set");

  const client = new QdrantClient({
    url: env.QD_URL,
    apiKey: env.QD_API_KEY,
    timeout: 10000, // 10秒のタイムアウト
  });

  try {
    console.log("Attempting to connect to Qdrant...");
    const collections = await client.getCollections();
    console.log("Successfully connected to Qdrant!");
    console.log(
      "Available collections:",
      collections.collections.map((c) => c.name),
    );

    // eth_global_showcaseコレクションの情報を取得
    try {
      const collectionInfo = await client.getCollection("eth_global_showcase");
      console.log("\nCollection 'eth_global_showcase' info:");
      console.log("- Points count:", collectionInfo.points_count);
      console.log("- Vectors size:", collectionInfo.config?.params?.vectors);
    } catch (error) {
      console.log("Collection 'eth_global_showcase' not found");
    }
  } catch (error: any) {
    console.error("Failed to connect to Qdrant:");
    console.error("Error message:", error.message);
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Unexpected error:", error);
      process.exit(1);
    });
}

export { testConnection };
