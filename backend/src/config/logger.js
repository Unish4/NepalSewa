import pino from "pino";
import ENV from "./env.js";

const logger = pino({
  level:
    ENV.NODE_ENV === "test"
      ? "silent"
      : ENV.NODE_ENV === "production"
        ? "info"
        : "debug",
  transport:
    ENV.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
export default logger;
