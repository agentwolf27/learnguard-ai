import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LtiLaunchContext } from "@/lib/types";

function roleToPrisma(role: LtiLaunchContext["role"]) {
  if (role === "admin") {
    return UserRole.ADMIN;
  }

  if (role === "teacher") {
    return UserRole.TEACHER;
  }

  return UserRole.STUDENT;
}

function inferSubjectArea(courseName?: string) {
  const name = courseName?.toLowerCase() || "";

  if (name.includes("computer")) return "Computer Science";
  if (name.includes("english") || name.includes("writing")) return "English";
  if (name.includes("math") || name.includes("calculus")) return "Mathematics";
  if (name.includes("history")) return "History";
  if (name.includes("science") || name.includes("biology")) return "Science";

  return "General Education";
}

function slugifySchool(domain: string) {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function isMockLaunch() {
  return process.env.LTI_MOCK_MODE === "true";
}

export async function resolveOrCreateLtiRecords(context: LtiLaunchContext) {
  const domain = context.canvasHost || "canvas.instructure.com";
  const slug = slugifySchool(domain) || "northstar-high";

  // In mock/demo mode, keep the seeded Northstar school for a stable professor demo.
  // In real launches, resolve strictly by Canvas domain (or slug) so tenants do not collapse.
  let school = isMockLaunch()
    ? await prisma.school.findFirst({
        where: {
          OR: [{ domain }, { slug: "northstar-high" }, { name: "Northstar High School" }]
        }
      })
    : await prisma.school.findFirst({
        where: {
          OR: [{ domain }, { slug }]
        }
      });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: isMockLaunch() ? "Northstar High School" : `${domain} School`,
        slug: isMockLaunch() ? "northstar-high" : slug,
        domain
      }
    });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      schoolId: school.id,
      canvasUserId: context.userId
    }
  });
  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: context.userName,
          email: context.userEmail,
          role: roleToPrisma(context.role),
          schoolId: school.id
        }
      })
    : await prisma.user.create({
        data: {
          canvasUserId: context.userId,
          name: context.userName,
          email: context.userEmail,
          role: roleToPrisma(context.role),
          schoolId: school.id
        }
      });

  let course = context.courseId
    ? await prisma.course.findFirst({
        where: {
          schoolId: school.id,
          canvasCourseId: context.courseId
        }
      })
    : null;

  if (!course && context.courseId) {
    course = await prisma.course.create({
      data: {
        canvasCourseId: context.courseId,
        name: context.courseName || "Canvas Course",
        subjectArea: inferSubjectArea(context.courseName),
        schoolId: school.id,
        teacherId: context.role === "teacher" ? user.id : undefined
      }
    });
  }

  if (course && context.role === "teacher" && course.teacherId !== user.id) {
    course = await prisma.course.update({
      where: { id: course.id },
      data: { teacherId: user.id }
    });
  }

  if (course) {
    await prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      },
      update: { role: roleToPrisma(context.role) },
      create: {
        userId: user.id,
        courseId: course.id,
        role: roleToPrisma(context.role)
      }
    });
  }

  let assignment = null;

  if (course && context.assignmentId) {
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        courseId: course.id,
        canvasAssignmentId: context.assignmentId
      }
    });

    assignment = existingAssignment
      ? await prisma.assignment.update({
          where: { id: existingAssignment.id },
          data: {
            title: context.assignmentTitle || "Canvas Assignment",
            teacherId: course.teacherId
          }
        })
      : await prisma.assignment.create({
          data: {
            canvasAssignmentId: context.assignmentId,
            title: context.assignmentTitle || "Canvas Assignment",
            courseId: course.id,
            teacherId: course.teacherId,
            policy: {
              create: {}
            }
          }
        });

    await prisma.assignmentPolicy.upsert({
      where: { assignmentId: assignment.id },
      update: {},
      create: {
        assignmentId: assignment.id
      }
    });
  }

  if (context.issuer && context.deploymentId) {
    await prisma.ltiDeployment.upsert({
      where: {
        issuer_clientId_deploymentId: {
          issuer: context.issuer,
          clientId: process.env.LTI_CLIENT_ID || "local-client-id",
          deploymentId: context.deploymentId
        }
      },
      update: {
        schoolId: school.id,
        jwksUrl: process.env.LTI_PLATFORM_JWKS_URL
      },
      create: {
        issuer: context.issuer,
        clientId: process.env.LTI_CLIENT_ID || "local-client-id",
        deploymentId: context.deploymentId,
        jwksUrl: process.env.LTI_PLATFORM_JWKS_URL,
        authLoginUrl: process.env.LTI_AUTH_LOGIN_URL,
        schoolId: school.id
      }
    });
  }

  return {
    school,
    user,
    course,
    assignment,
    teacherId: course?.teacherId || assignment?.teacherId || undefined
  };
}
