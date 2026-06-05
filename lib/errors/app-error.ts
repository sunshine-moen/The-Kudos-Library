export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many requests", "RATE_LIMITED", 429);
    this.name = "RateLimitError";
  }
}

export function toHttpResponse(error: unknown): { status: number; body: { error: string; code: string } } {
  if (error instanceof AppError) {
    return {
      status: error.httpStatus,
      body: { error: error.message, code: error.code },
    };
  }
  console.error("Unhandled error:", error);
  return {
    status: 500,
    body: { error: "Internal server error", code: "INTERNAL_ERROR" },
  };
}
