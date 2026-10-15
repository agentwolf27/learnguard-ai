#!/usr/bin/env node
/**
 * Validates environment variables for a target mode.
 * Usage:
 *   node scripts/validate-env.mjs demo
 *   node scripts/validate-env.mjs production
 */

const mode = process.argv[2] || "demo";

const requiredByMode = {
  demo: ["DATABASE_URL", "NEXT_PUBLIC_APP_URL"],
  production: [
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "LTI_SESSION_SECRET",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "LTI_CLIENT_ID",
    "LTI_ISSUER",
    "LTI_DEPLOYMENT_ID"
  ]
};

const required = requiredByMode[mode];
if (!required) {
  console.error(`Unknown mode "${mode}". Use "demo" or "production".`);
  process.exit(1);
}

const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === "");
const warnings = [];

if (mode === "production" && process.env.LTI_MOCK_MODE === "true") {
  warnings.push('LTI_MOCK_MODE is "true" — set to "false" for real Canvas production.');
}

if (mode === "production" && !process.env.OPENAI_API_KEY) {
  warnings.push("OPENAI_API_KEY is empty — deterministic mocks will be used (OK until privacy review).");
}

if (
  process.env.LTI_SESSION_SECRET === "learnguard-dev-session-secret-change-me" ||
  (process.env.LTI_SESSION_SECRET && process.env.LTI_SESSION_SECRET.trim().length < 32) ||
  (!process.env.LTI_SESSION_SECRET && mode === "production")
) {
  warnings.push("Use a strong unique LTI_SESSION_SECRET (32+ characters) — a production server will not start without one.");
}

console.log(`Validate env mode: ${mode}`);
if (missing.length) {
  console.error("\nMissing required variables:");
  for (const key of missing) console.error(`  - ${key}`);
  process.exit(1);
}

console.log("All required variables are set.");
if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`  - ${warning}`);
}
