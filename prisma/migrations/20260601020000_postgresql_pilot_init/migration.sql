-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'PROMPT_SUBMITTED', 'PROMPT_BLOCKED', 'POLICY_CHANGED', 'DASHBOARD_ACCESSED', 'LTI_LAUNCH', 'DEEP_LINK_REQUESTED', 'AUTHORIZATION_DENIED', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "canvasUserId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "canvasCourseId" TEXT,
    "name" TEXT NOT NULL,
    "subjectArea" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "canvasAssignmentId" TEXT,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiDeployment" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "jwksUrl" TEXT,
    "authLoginUrl" TEXT,
    "authTokenUrl" TEXT,
    "nrpsContextMembershipUrl" TEXT,
    "agsLineItemsUrl" TEXT,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LtiDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT,
    "schoolId" TEXT NOT NULL,
    "courseId" TEXT,
    "assignmentId" TEXT,
    "originalPrompt" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "category" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "educationalAlternative" TEXT NOT NULL,
    "matchedPhrases" TEXT NOT NULL DEFAULT '[]',
    "estimatedTokens" DOUBLE PRECISION NOT NULL,
    "estimatedCO2Grams" DOUBLE PRECISION NOT NULL,
    "estimatedWaterML" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptClassification" (
    "id" TEXT NOT NULL,
    "promptLogId" TEXT,
    "flagged" BOOLEAN NOT NULL,
    "matchedPhrases" TEXT NOT NULL DEFAULT '[]',
    "riskLevel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL,
    "educationalAlternative" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentPolicy" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "allowBrainstorming" BOOLEAN NOT NULL DEFAULT true,
    "allowOutlining" BOOLEAN NOT NULL DEFAULT true,
    "allowDraftFeedback" BOOLEAN NOT NULL DEFAULT true,
    "allowConceptExplanation" BOOLEAN NOT NULL DEFAULT true,
    "blockFullEssayGeneration" BOOLEAN NOT NULL DEFAULT true,
    "blockFinalAnswers" BOOLEAN NOT NULL DEFAULT true,
    "blockTestQuizSolving" BOOLEAN NOT NULL DEFAULT true,
    "blockPlagiarismEvasion" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningInsight" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "courseId" TEXT,
    "assignmentId" TEXT,
    "subjectArea" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "studentStruggleScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "summary" TEXT NOT NULL,
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMetric" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "courseId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "totalPrompts" INTEGER NOT NULL DEFAULT 0,
    "activeStudents" INTEGER NOT NULL DEFAULT 0,
    "highRiskPrompts" INTEGER NOT NULL DEFAULT 0,
    "blockedPrompts" INTEGER NOT NULL DEFAULT 0,
    "learningSessions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "userId" TEXT,
    "clerkUserId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "School_domain_key" ON "School"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_schoolId_role_idx" ON "User"("schoolId", "role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_schoolId_canvasUserId_key" ON "User"("schoolId", "canvasUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Course_schoolId_teacherId_idx" ON "Course"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "Course_schoolId_subjectArea_idx" ON "Course"("schoolId", "subjectArea");

-- CreateIndex
CREATE UNIQUE INDEX "Course_schoolId_canvasCourseId_key" ON "Course"("schoolId", "canvasCourseId");

-- CreateIndex
CREATE INDEX "Assignment_courseId_teacherId_idx" ON "Assignment"("courseId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_courseId_canvasAssignmentId_key" ON "Assignment"("courseId", "canvasAssignmentId");

-- CreateIndex
CREATE INDEX "LtiDeployment_schoolId_idx" ON "LtiDeployment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "LtiDeployment_issuer_clientId_deploymentId_key" ON "LtiDeployment"("issuer", "clientId", "deploymentId");

-- CreateIndex
CREATE INDEX "PromptLog_studentId_createdAt_idx" ON "PromptLog"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "PromptLog_schoolId_createdAt_idx" ON "PromptLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "PromptLog_courseId_createdAt_idx" ON "PromptLog"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "PromptLog_assignmentId_createdAt_idx" ON "PromptLog"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "PromptLog_riskLevel_allowed_idx" ON "PromptLog"("riskLevel", "allowed");

-- CreateIndex
CREATE INDEX "PromptLog_schoolId_riskLevel_createdAt_idx" ON "PromptLog"("schoolId", "riskLevel", "createdAt");

-- CreateIndex
CREATE INDEX "PromptLog_teacherId_createdAt_idx" ON "PromptLog"("teacherId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromptClassification_promptLogId_key" ON "PromptClassification"("promptLogId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentPolicy_assignmentId_key" ON "AssignmentPolicy"("assignmentId");

-- CreateIndex
CREATE INDEX "LearningInsight_schoolId_concept_idx" ON "LearningInsight"("schoolId", "concept");

-- CreateIndex
CREATE INDEX "LearningInsight_courseId_concept_idx" ON "LearningInsight"("courseId", "concept");

-- CreateIndex
CREATE INDEX "LearningInsight_schoolId_subjectArea_idx" ON "LearningInsight"("schoolId", "subjectArea");

-- CreateIndex
CREATE INDEX "UsageMetric_schoolId_date_idx" ON "UsageMetric"("schoolId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UsageMetric_schoolId_courseId_date_key" ON "UsageMetric"("schoolId", "courseId", "date");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_action_createdAt_idx" ON "AuditLog"("schoolId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_clerkUserId_createdAt_idx" ON "AuditLog"("clerkUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiDeployment" ADD CONSTRAINT "LtiDeployment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptLog" ADD CONSTRAINT "PromptLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptLog" ADD CONSTRAINT "PromptLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptLog" ADD CONSTRAINT "PromptLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptLog" ADD CONSTRAINT "PromptLog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptLog" ADD CONSTRAINT "PromptLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptClassification" ADD CONSTRAINT "PromptClassification_promptLogId_fkey" FOREIGN KEY ("promptLogId") REFERENCES "PromptLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentPolicy" ADD CONSTRAINT "AssignmentPolicy_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningInsight" ADD CONSTRAINT "LearningInsight_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningInsight" ADD CONSTRAINT "LearningInsight_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningInsight" ADD CONSTRAINT "LearningInsight_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMetric" ADD CONSTRAINT "UsageMetric_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMetric" ADD CONSTRAINT "UsageMetric_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

