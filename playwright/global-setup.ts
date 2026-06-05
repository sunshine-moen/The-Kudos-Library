import { type FullConfig } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

export const AG_ADMIN_AUTH_FILE = path.join(__dirname, ".auth", "ag-admin.json");
export const TEST_USER_AUTH_FILE = path.join(__dirname, ".auth", "test-user.json");

// Fixed IDs from seed-test-tenant.ts
const TEST_USER_ID = "00000000-0000-0000-0000-000000000030";

const SESSIONS = [
  { token: "pw-ag-admin", userId: null, email: "admin@ag.example.com", file: AG_ADMIN_AUTH_FILE },
  { token: "pw-test-user", userId: TEST_USER_ID, email: null, file: TEST_USER_AUTH_FILE },
] as const;

async function globalSetup(_config: FullConfig): Promise<void> {
  const prisma = new PrismaClient();

  // Determine session cookie name from NEXTAUTH_URL
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const secure = baseUrl.startsWith("https://");
  const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const domain = new URL(baseUrl).hostname;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  try {
    for (const session of SESSIONS) {
      // Resolve userId if not fixed
      let userId: string | null = session.userId;
      if (!userId && session.email) {
        const user = await prisma.user.findFirst({ where: { email: session.email }, select: { id: true } });
        if (!user) {
          console.warn(`[playwright/global-setup] User ${session.email} not found — skipping`);
          continue;
        }
        userId = user.id;
      }
      if (!userId) continue;

      await prisma.session.upsert({
        where: { sessionToken: session.token },
        update: { expires },
        create: { sessionToken: session.token, userId, expires },
      });

      fs.mkdirSync(path.dirname(session.file), { recursive: true });
      fs.writeFileSync(
        session.file,
        JSON.stringify({
          cookies: [
            {
              name: cookieName,
              value: session.token,
              domain,
              path: "/",
              expires: -1,
              httpOnly: true,
              secure,
              sameSite: "Lax",
            },
          ],
          origins: [],
        }),
      );
    }

    // Persist the first kudos ID from the test tenant for /book/[id] tests
    const kudos = await prisma.kudos.findFirst({
      where: { tenant_id: "00000000-0000-0000-0000-000000000002", deleted_at: null },
      select: { id: true },
    });
    const dataFile = path.join(__dirname, ".auth", "test-data.json");
    fs.writeFileSync(dataFile, JSON.stringify({ firstKudosId: kudos?.id ?? null }));
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
