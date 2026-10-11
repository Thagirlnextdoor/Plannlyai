import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./db";

// Phase 0/1: require login when present, else fall back to seeded demo user
// so the flow works on a local device before multi-user polish (Phase 7).
export async function resolveUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) return session.user.id;
  } catch {
    // auth tables unreachable or no session -> demo fallback below
  }
  const demo = await prisma.user.upsert({
    where: { email: "demo@plannlyai.local" },
    update: {},
    create: { email: "demo@plannlyai.local", name: "Demo User" },
  });
  return demo.id;
}
