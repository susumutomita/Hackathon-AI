import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseHtmlWithLLM } from "./llmParser";
import ollama from "ollama";
import Groq from "groq-sdk";
import logger from "@/lib/logger";

vi.mock("ollama");
vi.mock("groq-sdk");
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe.skip("parseHtmlWithLLM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("development environment (Ollama)", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      // Clear any model environment variables for testing
      delete process.env.OLLAMA_MODEL;
    });

    it("should parse idea using Ollama in development", async () => {
      const mockResponse = {
        message: {
          content: "  This is a parsed response  ",
        },
      };

      vi.mocked(ollama.chat).mockResolvedValue(mockResponse as any);

      const result = await parseHtmlWithLLM("Test idea", "Parse this idea");

      expect(ollama.chat).toHaveBeenCalledWith({
        model: "llama3.1", // Default model when OLLAMA_MODEL is not set
        messages: [
          {
            role: "user",
            content: "Parse this idea",
          },
        ],
      });

      expect(result).toBe("This is a parsed response");
      expect(logger.info).toHaveBeenCalledWith("Parsing idea with LLM...");
      expect(logger.info).toHaveBeenCalledWith(
        "Using local LLM (Ollama) with model: llama3.1",
      );
      expect(logger.info).toHaveBeenCalledWith("Local LLM response received:", {
        response: mockResponse,
      });
    });

    it("should handle Ollama errors", async () => {
      vi.mocked(ollama.chat).mockRejectedValue(
        new Error("Ollama connection failed"),
      );

      await expect(
        parseHtmlWithLLM("Test idea", "Parse this idea"),
      ).rejects.toThrow("Failed to parse LLM response");

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to parse LLM response:",
        expect.any(Error),
      );
    });

    it("should use custom model when OLLAMA_MODEL is set", async () => {
      process.env.OLLAMA_MODEL = "gpt-oss:20b";

      const mockResponse = {
        message: {
          content: "Custom model response",
        },
      };

      vi.mocked(ollama.chat).mockResolvedValue(mockResponse as any);

      const result = await parseHtmlWithLLM("Test idea", "Parse this idea");

      expect(ollama.chat).toHaveBeenCalledWith({
        model: "gpt-oss:20b",
        messages: [
          {
            role: "user",
            content: "Parse this idea",
          },
        ],
      });

      expect(result).toBe("Custom model response");
      expect(logger.info).toHaveBeenCalledWith(
        "Using local LLM (Ollama) with model: gpt-oss:20b",
      );
    });
  });

  describe("production environment (Groq)", () => {
    let mockGroqCreate: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.GROQ_API_KEY = "test-groq-key";
      // Clear any model environment variables for testing
      delete process.env.GROQ_MODEL;

      mockGroqCreate = vi.fn();
      vi.mocked(Groq).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockGroqCreate,
              },
            },
          }) as any,
      );
    });

    it("should parse idea using Groq in production", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "  This is a Groq parsed response  ",
            },
          },
        ],
      };

      mockGroqCreate.mockResolvedValue(mockResponse);

      const result = await parseHtmlWithLLM(
        "Test idea",
        "Parse this idea with Groq",
      );

      expect(Groq).toHaveBeenCalledWith({ apiKey: "test-groq-key" });
      expect(mockGroqCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: "user",
            content: "Parse this idea with Groq",
          },
        ],
        model: "llama3-8b-8192",
      });

      expect(result).toBe("This is a Groq parsed response");
      expect(logger.info).toHaveBeenCalledWith("Parsing idea with LLM...");
      expect(logger.info).toHaveBeenCalledWith(
        "Using cloud-based LLM (Groq) with model: llama3-8b-8192",
      );
      expect(logger.info).toHaveBeenCalledWith("Groq LLM response received:", {
        response: "  This is a Groq parsed response  ",
      });
    });

    it("should handle empty Groq response", async () => {
      const mockResponse = {
        choices: [],
      };

      mockGroqCreate.mockResolvedValue(mockResponse);

      const result = await parseHtmlWithLLM("Test idea", "Parse this idea");

      expect(result).toBe("");
    });

    it("should handle missing message content in Groq response", async () => {
      const mockResponse = {
        choices: [
          {
            message: {},
          },
        ],
      };

      mockGroqCreate.mockResolvedValue(mockResponse);

      const result = await parseHtmlWithLLM("Test idea", "Parse this idea");

      expect(result).toBe("");
    });

    it("should handle Groq API errors", async () => {
      mockGroqCreate.mockRejectedValue(new Error("Groq API error"));

      await expect(
        parseHtmlWithLLM("Test idea", "Parse this idea"),
      ).rejects.toThrow("Failed to parse LLM response");

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to parse LLM response:",
        expect.any(Error),
      );
    });

    it("should handle missing Groq API key", async () => {
      delete process.env.GROQ_API_KEY;

      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "Response without API key",
            },
          },
        ],
      });

      const result = await parseHtmlWithLLM("Test idea", "Parse this idea");

      expect(Groq).toHaveBeenCalledWith({ apiKey: undefined });
      expect(result).toBe("Response without API key");
    });
  });

  describe("environment detection", () => {
    it("should use Ollama when environment is not production", async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";

      vi.mocked(ollama.chat).mockResolvedValue({
        message: { content: "Staging response" },
      } as any);

      const result = await parseHtmlWithLLM("Test idea", "Parse this");

      expect(ollama.chat).toHaveBeenCalled();
      expect(result).toBe("Staging response");
    });

    it("should use Ollama when environment variable is not set", async () => {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT;

      vi.mocked(ollama.chat).mockResolvedValue({
        message: { content: "Default response" },
      } as any);

      const result = await parseHtmlWithLLM("Test idea", "Parse this");

      expect(ollama.chat).toHaveBeenCalled();
      expect(result).toBe("Default response");
    });
  });
});
