// Sentry stub — wire up real @sentry/nextjs when Sentry DSN is configured.
// captureSentry() is a no-op when SENTRY_DSN is absent; logs to stderr instead.

export function captureWarning(message: string, context?: Record<string, unknown>): void {
  if (process.env.SENTRY_DSN) {
    // When @sentry/nextjs is installed, replace with Sentry.captureMessage(message, { level: 'warning', extra: context })
    console.warn("[sentry:warning]", message, context);
  } else {
    console.warn("[monitoring:warning]", message, context);
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (process.env.SENTRY_DSN) {
    console.error("[sentry:error]", err, context);
  } else {
    console.error("[monitoring:error]", err, context);
  }
}
