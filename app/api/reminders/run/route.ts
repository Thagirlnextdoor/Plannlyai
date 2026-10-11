import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runDueReminders } from "@/lib/reminders";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { secret?: string } | null;
  if (!process.env.CRON_SECRET || body?.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const users = await prisma.user.findMany({ select: { id: true } });
  let nudges = 0;
  for (const u of users) nudges += (await runDueReminders(u.id)).length;
  return NextResponse.json({ ok: true, nudges, users: users.length });
}
