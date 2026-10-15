import { NextRequest, NextResponse } from "next/server";
import {
  buildOidcRedirectUrl,
  ltiNonceCookieName,
  ltiStateCookieName
} from "@/lib/lti";

function cookieSettings() {
  const secure = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    maxAge: 10 * 60,
    path: "/"
  };
}

async function paramsFromRequest(request: NextRequest) {
  if (request.method === "POST") {
    const formData = await request.formData();
    return new URLSearchParams(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
    );
  }

  return request.nextUrl.searchParams;
}

async function handleLogin(request: NextRequest) {
  const params = await paramsFromRequest(request);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const clientId = params.get("client_id") || process.env.LTI_CLIENT_ID;
  const loginHint = params.get("login_hint");

  if (!clientId || !loginHint) {
    return NextResponse.json(
      {
        error: "Missing required LTI login parameters.",
        required: ["client_id", "login_hint"]
      },
      { status: 400 }
    );
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const redirectUri = new URL("/api/lti/launch", baseUrl).toString();
  const redirectUrl = buildOidcRedirectUrl({
    issuer: params.get("iss") || undefined,
    loginHint,
    ltiMessageHint: params.get("lti_message_hint") || undefined,
    targetLinkUri: params.get("target_link_uri") || undefined,
    clientId,
    redirectUri,
    state,
    nonce,
    deploymentId: params.get("deployment_id") || process.env.LTI_DEPLOYMENT_ID || undefined
  });

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(ltiStateCookieName, state, cookieSettings());
  response.cookies.set(ltiNonceCookieName, nonce, cookieSettings());
  return response;
}

export async function GET(request: NextRequest) {
  return handleLogin(request);
}

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
