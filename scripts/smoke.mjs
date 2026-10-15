#!/usr/bin/env node
/**
 * Lightweight smoke test for a running LearnGuard dev/prod server.
 * Usage: npm run dev (in another terminal), then npm run smoke
 */
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const routes = [
  { path: "/", expect: 200 },
  { path: "/demo", expect: 200 },
  { path: "/privacy", expect: 200 },
  { path: "/pilot", expect: 200 },
  { path: "/api/health", expect: 200 },
  { path: "/api/mock-lti?role=student", expect: 307 }
];

async function checkRoute({ path, expect: expectedStatus }) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, { redirect: "manual" });
  const ok = response.status === expectedStatus;
  return { path, status: response.status, expectedStatus, ok };
}

async function main() {
  console.log(`Smoke testing ${baseUrl}\n`);
  let failed = 0;

  for (const route of routes) {
    try {
      const result = await checkRoute(route);
      const mark = result.ok ? "OK" : "FAIL";
      console.log(`${mark}  ${result.path} → ${result.status} (expected ${result.expectedStatus})`);
      if (!result.ok) failed += 1;
    } catch (error) {
      failed += 1;
      console.log(`FAIL  ${route.path} → ${error instanceof Error ? error.message : error}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll smoke checks passed.");
}

main();
