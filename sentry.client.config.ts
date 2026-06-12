// Sentry client-side initialization — uncomment when @sentry/nextjs is installed.
// Install: pnpm add @sentry/nextjs
// Then enable the config below and remove the lib/monitoring/sentry.ts stub.

// import * as Sentry from "@sentry/nextjs";
//
// Sentry.init({
//   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//   environment: process.env.NODE_ENV,
//   tracesSampleRate: 0.1,
//   beforeSend(event) {
//     // Strip PII from events before sending to Sentry
//     if (event.user) {
//       delete event.user.email;
//       delete event.user.username;
//     }
//     return event;
//   },
// });

export {};
