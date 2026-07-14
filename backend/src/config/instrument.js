import * as Sentry from "@sentry/node";
import ENV from "./env.js";

if (ENV.SENTRY_DSN) {
  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: ENV.NODE_ENV || "development",
    tracesSampleRate: ENV.NODE_ENV === "production" ? 0.1 : 0,
  });
  console.log("Sentry error monitoring initialized");
} else {
  console.warn("Sentry not configured — set SENTRY_DSN to enable error monitoring.");
}