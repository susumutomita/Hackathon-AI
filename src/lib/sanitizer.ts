import DOMPurify from "isomorphic-dompurify";

// XSS protection and HTML sanitization configuration
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "ol",
    "ul",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
  ],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  FORBID_SCRIPTS: true,
  FORBID_TAGS: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "textarea",
    "button",
    "select",
  ],
  FORBID_ATTR: [
    "onclick",
    "onload",
    "onerror",
    "onmouseover",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
    "style",
    "class",
    "id",
  ],
};

// Strict configuration for display content that shouldn't contain any HTML
const STRICT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML content
 * @param strict - Whether to use strict sanitization (no HTML tags allowed)
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string, strict: boolean = false): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  const config = strict ? STRICT_CONFIG : DOMPURIFY_CONFIG;
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitizes text content by removing all HTML and potentially dangerous characters
 * @param input - The input text to sanitize
 * @returns Sanitized text string
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return sanitizeHtml(input, true)
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .slice(0, 10000); // Limit length
}

/**
 * Sanitizes URLs to prevent javascript: and data: schemes
 * @param url - The URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  try {
    const parsed = new URL(url.trim());

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    // Block suspicious URLs
    const suspiciousPatterns = [
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /file:/gi,
      /about:/gi,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitizes project data from external sources
 * @param project - Project data to sanitize
 * @returns Sanitized project data
 */
export function sanitizeProjectData(project: any): any {
  if (!project || typeof project !== "object") {
    return {};
  }

  return {
    title: sanitizeText(project.title || ""),
    description: sanitizeHtml(project.description || "", false),
    howItsMade: sanitizeHtml(project.howItsMade || "", false),
    sourceCode: sanitizeUrl(project.sourceCode || ""),
    link: sanitizeText(project.link || ""),
  };
}

/**
 * Escapes special characters for safe display in HTML attributes
 * @param str - The string to escape
 * @returns Escaped string
 */
export function escapeHtmlAttribute(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Content Security Policy nonce generator
 * @returns Random nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
