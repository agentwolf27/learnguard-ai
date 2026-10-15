import { logger } from "@/lib/logger";

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    attempts?: number;
    delayMs?: number;
    label: string;
  }
) {
  const attempts = options.attempts || 2;
  const delayMs = options.delayMs || 250;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn("Retryable operation failed.", {
        label: options.label,
        attempt,
        attempts
      });

      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}
