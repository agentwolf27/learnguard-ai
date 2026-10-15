import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export class AppError extends Error {
  constructor(
    message: string,
    public status = 500,
    public code = "internal_error",
    public expose = status < 500
  ) {
    super(message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have access to this resource.") {
    super(message, 403, "authorization_denied");
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication is required.") {
    super(message, 401, "authentication_required");
  }
}

export function errorResponse(error: unknown, context: Record<string, unknown> = {}) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request payload.",
        code: "validation_error",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    if (error.status >= 500) {
      logger.error(error.message, error, context);
    }

    return NextResponse.json(
      {
        error: error.expose ? error.message : "An unexpected error occurred.",
        code: error.code
      },
      { status: error.status }
    );
  }

  logger.error("Unhandled API error.", error, context);
  return NextResponse.json(
    {
      error: "An unexpected error occurred.",
      code: "internal_error"
    },
    { status: 500 }
  );
}
