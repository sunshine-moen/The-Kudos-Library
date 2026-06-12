// Sentry server-side initialization — uncomment when @sentry/nextjs is installed.
// Install: pnpm add @sentry/nextjs
// Then enable the config below and remove the lib/monitoring/sentry.ts stub.

// import * as Sentry from "@sentry/nextjs";
//
// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
//   environment: process.env.NODE_ENV,
//   tracesSampleRate: 0.05,
//   beforeSend(event) {
//     // Strip PII from server-side events
//     if (event.user) {
//       delete event.user.email;
//       delete event.user.username;
//     }
//     if (event.request?.data) {
//       event.request.data = "[Filtered]";
//     }
//     return event;
//   },
// });

export {};
