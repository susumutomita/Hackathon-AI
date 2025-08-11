import "dotenv/config";
import { OllamaAdapter } from "@/adapters/ollama.adapter";

async function testEmbedding() {
  try {
    console.log("Testing Ollama embedding creation...");

    const adapter = new OllamaAdapter();
    const testText = "This is a test message for embedding creation";

    console.log("Creating embedding for:", testText);
    const embedding = await adapter.createEmbedding(testText);

    console.log("✅ Success! Embedding created");
    console.log("Embedding dimensions:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));

    return true;
  } catch (error: any) {
    console.error("❌ Failed to create embedding:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
    return false;
  }
}

if (require.main === module) {
  testEmbedding()
    .then((success) => {
      if (success) {
        console.log("\n✅ Ollama is working correctly!");
        console.log("You can now use the search-ideas API.");
      } else {
        console.log("\n❌ Please ensure Ollama is running: ollama serve");
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unexpected error:", error);
      process.exit(1);
    });
}

export { testEmbedding };
