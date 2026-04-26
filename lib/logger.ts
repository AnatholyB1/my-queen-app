import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  transport: !isProd
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
      }
    : undefined,
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "*.authorization",
      "*.privateKey",
      "*.private_key",
    ],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;
