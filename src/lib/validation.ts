import { z } from "zod";
// Import comprehensive sanitization from sanitizer module
import { sanitizeText } from "./sanitizer";

// Common validation schemas
export const IdeaSchema = z
  .string()
  .min(1, "アイデアは必須です")
  .max(5000, "アイデアは5000文字以内で入力してください")
  .refine((value) => value.trim().length > 0, "アイデアは空白のみにできません");

export const SimilarProjectSchema = z.object({
  title: z.string().min(1, "プロジェクトタイトルは必須です"),
  description: z.string().min(1, "プロジェクト説明は必須です"),
  howItsMade: z.string().optional(),
  sourceCode: z.string().url("無効なURLです").optional(),
  link: z.string().optional(),
});

export const SearchIdeasRequestSchema = z.object({
  idea: IdeaSchema,
});

export const ImproveIdeaRequestSchema = z.object({
  idea: IdeaSchema,
  similarProjects: z
    .array(SimilarProjectSchema)
    .max(20, "類似プロジェクトは20件以内にしてください")
    .default([]),
});

// Generate idea from prize brief (simple version)
export const GenerateIdeaRequestSchema = z.object({
  prize: z
    .string()
    .min(10, "プライズの説明は10文字以上で入力してください")
    .max(8000, "プライズの説明は8000文字以内で入力してください")
    .refine((v) => v.trim().length > 0, "プライズの説明は空白のみにできません"),
});

// Generate winning idea from detailed prize info
export const GenerateWinningIdeaRequestSchema = z.object({
  prizeInfo: z.object({
    sponsor: z.string().min(1, "Sponsor name is required"),
    prizeName: z.string().min(1, "Prize name is required"),
    prizeAmount: z.string().optional(),
    requirements: z
      .string()
      .min(10, "Requirements must be at least 10 characters"),
    technologies: z.array(z.string()).optional(),
    judgingCriteria: z.array(z.string()).optional(),
    additionalInfo: z.string().optional(),
  }),
  focusArea: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  preferredTech: z.array(z.string()).optional(),
});

export const CrawlRequestSchema = z.object({
  url: z
    .string()
    .url("有効なURLを入力してください")
    .refine((url) => {
      // Only allow specific domains for security
      const allowedDomains = [
        "ethglobal.com",
        "github.com",
        "devpost.com",
        "hackathon.io",
      ];
      try {
        const domain = new URL(url).hostname;
        return allowedDomains.some((allowed) => domain.includes(allowed));
      } catch {
        return false;
      }
    }, "許可されていないドメインです"),
});

// Sanitization functions
export function sanitizeString(input: string): string {
  return sanitizeText(input);
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

// Input validation wrapper with error handling
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "検証エラーが発生しました",
      };
    }
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}

// Rate limiting configuration
export const RATE_LIMITS = {
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 search requests per minute
  },
  CRAWL: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // limit each IP to 5 crawl requests per 5 minutes
  },
} as const;
