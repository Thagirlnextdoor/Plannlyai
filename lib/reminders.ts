import { prisma } from "./db";

export interface Nudge {
  reminderId: string;
  text: string;
  taskId: string | null;
  taskTitle?: string;
  runsSoFar: number;
  suggestBreakdown: boolean;
}

// One-shot ("once") or repeating ("daily") follow-ups. Free, on-device.
export async function createFollowUp(userId: string, text: string, daysFromNow: number, taskId?: string, rule = "once") {
  const nextRunAt = new Date();
  nextRunAt.setDate(nextRunAt.getDate() + daysFromNow);
  return prisma.reminder.create({
    data: { userId, context: text, taskId: taskId ?? null, rule, nextRunAt, status: "active" },
  });
}

// Idempotent runner: each due reminder produces exactly one run per pass,
// then one-shot reminders retire. Returns nudges for display.
// Ignored x3 (3+ runs, task still open) -> suggestBreakdown flag.
export async function runDueReminders(userId?: string): Promise<Nudge[]> {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: { status: "active", nextRunAt: { lte: now }, ...(userId ? { userId } : {}) },
    include: { runs: true, task: true },
    take: 100,
  });
  const nudges: Nudge[] = [];
  for (const r of due) {
    // Idempotency: skip if already ran in the last 55 minutes (overlapping ticks).
    const fresh = r.runs.some((run) => now.getTime() - new Date(run.ranAt).getTime() < 55 * 60 * 1000);
    if (!fresh) {
      await prisma.reminderRun.create({ data: { reminderId: r.id, result: "nudged" } });
      if (r.rule === "once") {
        await prisma.reminder.update({ where: { id: r.id }, data: { status: "nudged" } });
      } else {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        await prisma.reminder.update({ where: { id: r.id }, data: { nextRunAt: next } });
      }
    }
    const runsSoFar = r.runs.length + (fresh ? 0 : 1);
    const taskOpen = !!r.task && r.task.status !== "done";
    nudges.push({
      reminderId: r.id,
      text: r.context ?? "Follow-up",
      taskId: r.taskId,
      taskTitle: r.task?.title,
      runsSoFar,
      suggestBreakdown: taskOpen && runsSoFar >= 3,
    });
  }
  return nudges;
}

export function nudgeText(n: Nudge): string {
  if (n.taskTitle) {
    return `You planned to work on “${n.taskTitle}”${n.runsSoFar > 1 ? ` (nudge #${n.runsSoFar})` : ""}. ${n.suggestBreakdown ? "This one keeps slipping — want to make it smaller?" : "Want to handle the next bit now?"}`;
  }
  return `${n.text}${n.runsSoFar > 1 ? ` (reminder #${n.runsSoFar})` : ""}`;
}
