type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const payload = {
    level,
    message,
    service: "learnguard-ai",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    ...context
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, error?: unknown, context: LogContext = {}) =>
    write("error", message, {
      ...context,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error
    })
};
