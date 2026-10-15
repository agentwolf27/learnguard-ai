import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export const promptRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt is required.")
    .max(6000, "Prompt must be 6,000 characters or fewer."),
  context: z
    .object({
      userId: z.string().min(1),
      userName: z.string().min(1),
      userEmail: z.string().email().optional(),
      role: z.enum(["student", "teacher", "admin"]),
      courseId: z.string().optional(),
      courseName: z.string().optional(),
      assignmentId: z.string().optional(),
      assignmentTitle: z.string().optional(),
      deploymentId: z.string().optional(),
      issuer: z.string().url().optional(),
      targetLinkUri: z.string().url().optional(),
      canvasHost: z.string().optional()
    })
    .optional()
});

export const policyPatchSchema = z
  .object({
    allowBrainstorming: z.boolean().optional(),
    allowOutlining: z.boolean().optional(),
    allowDraftFeedback: z.boolean().optional(),
    allowConceptExplanation: z.boolean().optional(),
    blockFullEssayGeneration: z.boolean().optional(),
    blockFinalAnswers: z.boolean().optional(),
    blockTestQuizSolving: z.boolean().optional(),
    blockPlagiarismEvasion: z.boolean().optional(),
    requireCitation: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one policy field is required.");

export function securityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com https://*.clerk.accounts.dev https://*.clerk.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.instructure.com",
      "frame-ancestors 'self' https://*.instructure.com"
    ].join("; ")
  );
  return response;
}

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function requestMetadata(request: NextRequest) {
  return {
    ipAddress: clientIp(request),
    userAgent: request.headers.get("user-agent") || undefined,
    requestId: request.headers.get("x-request-id") || crypto.randomUUID()
  };
}

export function assertSameOrigin(request: NextRequest) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    throw new AppError("Missing CSRF origin header.", 403, "csrf_failed");
  }

  const originHost = new URL(origin).host;

  if (originHost !== host) {
    throw new AppError("Invalid CSRF origin.", 403, "csrf_failed");
  }
}

export function assertRateLimit(
  request: NextRequest,
  options: {
    key: string;
    limit: number;
    windowMs: number;
  }
) {
  const bucketKey = `${options.key}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs
    });
    return;
  }

  if (bucket.count >= options.limit) {
    throw new AppError("Too many requests. Please wait and try again.", 429, "rate_limited");
  }

  bucket.count += 1;
}

export function sanitizePrompt(prompt: string) {
  return prompt.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
}
