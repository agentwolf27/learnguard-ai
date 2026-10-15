import { NextResponse } from "next/server";
import { hasOpenAIKey } from "@/lib/openaiClient";
import { prisma } from "@/lib/prisma";
import { ltiSessionSecretConfigured } from "@/lib/lti-session-secret";

export const dynamic = "force-dynamic";

export async function GET() {
  const ltiMockMode = process.env.LTI_MOCK_MODE === "true";
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
  const ltiProductionConfigured = Boolean(
    process.env.LTI_CLIENT_ID && process.env.LTI_ISSUER && process.env.LTI_DEPLOYMENT_ID
  );
  const sessionSecretConfigured = ltiSessionSecretConfigured();
  const appUrlConfigured = Boolean(process.env.NEXT_PUBLIC_APP_URL);

  const checks: Record<string, boolean | string> = {
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    appUrlConfigured,
    ltiMockMode,
    openAiConfigured: hasOpenAIKey(),
    clerkConfigured,
    ltiProductionConfigured,
    sessionSecretConfigured
  };

  let databaseReachable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseReachable = true;
  } catch {
    databaseReachable = false;
  }

  checks.databaseReachable = databaseReachable;

  const readyForDemo = databaseReachable && ltiMockMode;
  const readyForCanvasPilot =
    databaseReachable &&
    !ltiMockMode &&
    ltiProductionConfigured &&
    sessionSecretConfigured &&
    appUrlConfigured &&
    clerkConfigured;

  const hints: string[] = [];
  if (!databaseReachable) hints.push("Configure DATABASE_URL (Neon) and run npm run db:deploy");
  if (ltiMockMode) hints.push("Demo/mock mode is ON — set LTI_MOCK_MODE=false for real Canvas");
  if (!ltiMockMode && !ltiProductionConfigured) {
    hints.push("Set LTI_CLIENT_ID, LTI_ISSUER, and LTI_DEPLOYMENT_ID for Canvas");
  }
  if (!clerkConfigured) hints.push("Add Clerk keys for teacher/admin sign-in");
  if (!sessionSecretConfigured) hints.push("Set LTI_SESSION_SECRET for signed LTI sessions");
  if (!hasOpenAIKey()) hints.push("OPENAI_API_KEY empty — using deterministic mocks (OK until privacy review)");

  const status = readyForCanvasPilot
    ? "ready_for_pilot"
    : readyForDemo
      ? "ready_for_demo"
      : databaseReachable
        ? "degraded"
        : "unhealthy";

  return NextResponse.json({
    status,
    readyForDemo,
    readyForCanvasPilot,
    checks,
    hints
  });
}
