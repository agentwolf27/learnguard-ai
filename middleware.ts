import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { securityHeaders } from "@/lib/security";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/lti/student(.*)", "/lti/teacher(.*)"]);
const isAdminRoute = createRouteMatcher(["/dashboard/admin(.*)"]);
const isTeacherRoute = createRouteMatcher(["/dashboard/teacher(.*)", "/lti/teacher(.*)"]);

function roleFromClaims(sessionClaims: unknown) {
  const claims = sessionClaims as { metadata?: { role?: string }; publicMetadata?: { role?: string } } | null;
  return (claims?.metadata?.role || claims?.publicMetadata?.role || "").toLowerCase();
}

function canAccessTeacher(role: string) {
  return ["teacher", "instructor", "admin", "school_admin"].includes(role);
}

function canAccessAdmin(role: string) {
  return ["admin", "school_admin"].includes(role);
}

const securedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authState = await auth.protect();
    const role = roleFromClaims(authState.sessionClaims);

    if (isAdminRoute(req) && !canAccessAdmin(role)) {
      return securityHeaders(NextResponse.redirect(new URL("/dashboard/teacher", req.url)));
    }

    if (isTeacherRoute(req) && !canAccessTeacher(role)) {
      return securityHeaders(NextResponse.redirect(new URL("/lti/student", req.url)));
    }
  }

  return securityHeaders(NextResponse.next());
});

export default clerkConfigured
  ? securedMiddleware
  : function middleware() {
      return securityHeaders(NextResponse.next());
    };

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
