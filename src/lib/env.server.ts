import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  APP_URL: z.url(),
  CRON_SECRET: z.string().min(32).optional(),
  DEVICE_SECRET_KEY: z.string().min(1).optional(),
  DEVICE_SECRET_KEY_ID: z.string().min(1).optional(),
  SENTRY_DSN: z.url().optional(),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    APP_URL: process.env.APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    DEVICE_SECRET_KEY: process.env.DEVICE_SECRET_KEY,
    DEVICE_SECRET_KEY_ID: process.env.DEVICE_SECRET_KEY_ID,
    SENTRY_DSN: process.env.SENTRY_DSN,
  });
}
