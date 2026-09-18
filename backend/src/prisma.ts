import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance (important in dev with hot-reload,
// avoids exhausting the Postgres connection pool).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
