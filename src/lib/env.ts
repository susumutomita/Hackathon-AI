import { z } from "zod";

/**
 * Environment validation schema
 */
const envSchema = z.object({
  // Qdrant Configuration
  QD_URL: z.string().url().default("http://localhost:6333"),
  QD_API_KEY: z.string().optional(),

  // Nomic API Configuration
  NOMIC_API_KEY: z.string().min(1, "NOMIC_API_KEY is required for production"),

  // Environment Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_ENVIRONMENT: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Development environment schema (more lenient)
 */
const devEnvSchema = z.object({
  // Qdrant Configuration
  QD_URL: z.string().url().default("http://localhost:6333"),
  QD_API_KEY: z.string().optional(),

  // Nomic API Configuration - optional in development
  NOMIC_API_KEY: z.string().optional(),

  // Environment Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_ENVIRONMENT: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Production environment schema (strict)
 */
const prodEnvSchema = z.object({
  // Qdrant Configuration
  QD_URL: z.string().url("QD_URL must be a valid URL"),
  QD_API_KEY: z.string().min(1, "QD_API_KEY is required in production"),

  // Nomic API Configuration
  NOMIC_API_KEY: z.string().min(1, "NOMIC_API_KEY is required in production"),

  // Environment Configuration
  NODE_ENV: z.enum(["development", "production", "test"]),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["development", "production", "test"]),
});

/**
 * Type for validated environment variables
 */
export type Environment = z.infer<typeof envSchema>;
export type DevEnvironment = z.infer<typeof devEnvSchema>;
export type ProdEnvironment = z.infer<typeof prodEnvSchema>;

/**
 * Validates environment variables based on the current environment
 * @returns Validated environment variables
 * @throws Error if validation fails
 */
export function validateEnv(): DevEnvironment | ProdEnvironment {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

  const schema = isProduction ? prodEnvSchema : devEnvSchema;

  try {
    return schema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Environment validation failed: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Gets a validated environment variable
 * @param key Environment variable key
 * @returns The environment variable value
 * @throws Error if the variable is not found or invalid
 */
export function getEnvVar(
  key: keyof (DevEnvironment & ProdEnvironment),
): string {
  const env = validateEnv();
  const value = env[key];

  if (value === undefined || value === "") {
    throw new Error(`Environment variable ${key} is not set or is empty`);
  }

  return value;
}

/**
 * Gets an optional environment variable
 * @param key Environment variable key
 * @param defaultValue Default value if not set
 * @returns The environment variable value or default
 */
export function getOptionalEnvVar(
  key: keyof (DevEnvironment & ProdEnvironment),
  defaultValue?: string,
): string | undefined {
  try {
    const env = validateEnv();
    return env[key] || defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Checks if running in production environment
 */
export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
  );
}

/**
 * Checks if running in development environment
 */
export function isDevelopment(): boolean {
  return !isProduction();
}

// Validate environment on module load to catch errors early
let cachedEnv: DevEnvironment | ProdEnvironment | null = null;

export function getValidatedEnv(): DevEnvironment | ProdEnvironment {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

// Test helper to reset cached environment
export function resetEnvCache(): void {
  cachedEnv = null;
}
