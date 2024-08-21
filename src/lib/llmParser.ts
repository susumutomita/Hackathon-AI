import ollama from "ollama";

export async function parseHtmlWithLLM(
  html: string,
  prompt: string,
): Promise<any> {
  console.log("Parsing HTML with LLM...");
  const fullPrompt = `
  ${prompt}

  Here is the HTML content:
  ${html}
  `;

  try {
    const response = await ollama.chat({
      model: "llama3.1",
      messages: [{ role: "user", content: fullPrompt }],
    });

    console.log("LLM response:", response);

    return JSON.parse(response.message.content.trim());
  } catch (error) {
    console.error("Failed to parse LLM response:", error);
    return null;
  }
}
