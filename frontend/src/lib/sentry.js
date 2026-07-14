import * as Sentry from "@sentry/react";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn(
      "Sentry not configured for frontend — set VITE_SENTRY_DSN to enable.",
    );
    return;
  }
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 0,
  });
};
