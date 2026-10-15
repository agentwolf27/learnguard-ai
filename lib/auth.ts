import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AuthenticationError, AuthorizationError } from "@/lib/errors";
import { getLtiContextFromCookies } from "@/lib/lti";
import { resolveOrCreateLtiRecords } from "@/lib/ltiPersistence";
import { prisma } from "@/lib/prisma";

type ClerkMetadata = {
  role?: string;
  schoolId?: string;
  schoolSlug?: string;
  schoolName?: string;
};

export type AuthenticatedViewer = {
  clerkUserId?: string;
  userId: string;
  schoolId: string;
  role: UserRole;
  name: string;
  email?: string;
};

export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export function normalizeRole(role?: string): UserRole {
  const normalized = role?.toLowerCase().replace(/[-\s]/g, "_");

  if (normalized === "school_admin" || normalized === "admin") {
    return UserRole.ADMIN;
  }

  if (normalized === "teacher" || normalized === "instructor") {
    return UserRole.TEACHER;
  }

  return UserRole.STUDENT;
}

function roleAllows(role: UserRole, allowedRoles: UserRole[]) {
  if (allowedRoles.includes(role)) {
    return true;
  }

  return role === UserRole.ADMIN && allowedRoles.includes(UserRole.TEACHER);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

async function getDemoViewer(role: UserRole) {
  const school =
    (await prisma.school.findFirst({
      where: { slug: "northstar-high" }
    })) ||
    (await prisma.school.create({
      data: {
        name: "Northstar High School",
        slug: "northstar-high",
        domain: "canvas.instructure.com"
      }
    }));

  const fallbackCanvasUserId =
    role === UserRole.ADMIN
      ? "canvas-admin-1"
      : role === UserRole.TEACHER
        ? "canvas-teacher-1"
        : "canvas-student-1";
  const existing = await prisma.user.findFirst({
    where: {
      schoolId: school.id,
      canvasUserId: fallbackCanvasUserId
    }
  });

  const user =
    existing ||
    (await prisma.user.create({
      data: {
        schoolId: school.id,
        canvasUserId: fallbackCanvasUserId,
        name:
          role === UserRole.ADMIN
            ? "Jordan Lee"
            : role === UserRole.TEACHER
              ? "Maya Reynolds"
              : "Avery Chen",
        email:
          role === UserRole.ADMIN
            ? "jordan.lee@northstar.example"
            : role === UserRole.TEACHER
              ? "maya.reynolds@northstar.example"
              : "avery.chen@northstar.example",
        role
      }
    }));

  return {
    userId: user.id,
    schoolId: school.id,
    role: user.role,
    name: user.name,
    email: user.email || undefined
  } satisfies AuthenticatedViewer;
}

async function getOrCreateSchool(metadata: ClerkMetadata, email?: string) {
  if (metadata.schoolId) {
    const school = await prisma.school.findUnique({ where: { id: metadata.schoolId } });
    if (school) return school;
  }

  const emailDomain = email?.split("@")[1];
  const slug = metadata.schoolSlug || slugify(metadata.schoolName || emailDomain || "pilot-school");
  const name = metadata.schoolName || `${slug.replace(/-/g, " ")} School`;

  return prisma.school.upsert({
    where: { slug },
    update: {
      name,
      domain: emailDomain || undefined
    },
    create: {
      slug,
      name,
      domain: emailDomain || undefined
    }
  });
}

export async function getAuthenticatedViewer({
  required = true,
  allowedRoles,
  demoRole = UserRole.TEACHER
}: {
  required?: boolean;
  allowedRoles?: UserRole[];
  demoRole?: UserRole;
} = {}): Promise<AuthenticatedViewer | null> {
  // Prefer a verified LTI launch session when one is present. The session
  // cookie is a signed JWT (see lib/lti.ts), so it is the trustworthy source of
  // truth for Canvas-initiated access and takes precedence over the demo viewer
  // and direct Clerk sign-in.
  const ltiContext = await getLtiContextFromCookies();
  if (ltiContext) {
    const records = await resolveOrCreateLtiRecords(ltiContext);
    const viewer: AuthenticatedViewer = {
      userId: records.user.id,
      schoolId: records.school.id,
      role: records.user.role,
      name: records.user.name,
      email: records.user.email || undefined
    };

    if (allowedRoles && !roleAllows(viewer.role, allowedRoles)) {
      throw new AuthorizationError();
    }

    return viewer;
  }

  if (!isClerkConfigured()) {
    const viewer = await getDemoViewer(demoRole);

    if (allowedRoles && !roleAllows(viewer.role, allowedRoles)) {
      throw new AuthorizationError();
    }

    return viewer;
  }

  const authState = await auth();

  if (!authState.userId) {
    if (required) {
      throw new AuthenticationError();
    }

    return null;
  }

  const clerkUser = await currentUser();
  const primaryEmail = clerkUser?.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;
  const metadata = (clerkUser?.publicMetadata || {}) as ClerkMetadata;
  const role = normalizeRole(metadata.role);

  if (allowedRoles && !roleAllows(role, allowedRoles)) {
    throw new AuthorizationError();
  }

  const school = await getOrCreateSchool(metadata, primaryEmail);
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    primaryEmail ||
    "LearnGuard User";

  const user = await prisma.user.upsert({
    where: { clerkUserId: authState.userId },
    update: {
      schoolId: school.id,
      name,
      email: primaryEmail,
      role
    },
    create: {
      clerkUserId: authState.userId,
      schoolId: school.id,
      name,
      email: primaryEmail,
      role
    }
  });

  return {
    clerkUserId: authState.userId,
    userId: user.id,
    schoolId: school.id,
    role: user.role,
    name: user.name,
    email: user.email || undefined
  };
}

export async function requirePageViewer(options?: {
  allowedRoles?: UserRole[];
  demoRole?: UserRole;
}): Promise<AuthenticatedViewer> {
  try {
    const viewer = await getAuthenticatedViewer({
      required: true,
      allowedRoles: options?.allowedRoles,
      demoRole: options?.demoRole
    });

    if (!viewer) {
      throw new AuthenticationError();
    }

    return viewer;
  } catch (error) {
    if (error instanceof AuthenticationError && isClerkConfigured()) {
      redirect("/sign-in");
    }

    throw error;
  }
}
