import { prisma } from "./db";

export interface TodayItem {
  id: string;
  title: string;
  status: string;
  estimateMin: number | null;
  goalId: string | null;
  goalTitle?: string;
}

// Curated Today: max 3 priorities (open, oldest first), quick wins (<=5m),
// scheduled (due today), done. Forward-only: no defer/snooze surfaced.
export async function listToday(userId: string) {
  const open = await prisma.task.findMany({
    where: { userId, status: { in: ["todo", "doing"] } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: 50,
  });
  const doneToday = await prisma.task.findMany({
    where: { userId, status: "done" },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const scheduled = await prisma.event.findMany({
    where: { userId, startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: "asc" },
  });
  const goals = await prisma.goal.findMany({ where: { userId, status: "active" } });
  const names = Object.fromEntries(goals.map((g) => [g.id, g.title]));
  const withGoal = (t: (typeof open)[number]): TodayItem => ({ ...t, goalTitle: t.goalId ? names[t.goalId] : undefined });
  const priorities = open.slice(0, 3).map(withGoal);
  const priorityIds = new Set(priorities.map((p) => p.id));
  const quickWins = open.filter((t) => !priorityIds.has(t.id) && (t.estimateMin ?? 25) <= 5).slice(0, 3).map(withGoal);
  return {
    priorities,
    quickWins,
    scheduled,
    done: doneToday.map(withGoal),
    doneCount: doneToday.length,
    total: open.length + doneToday.length,
    activeGoals: goals.slice(0, 6),
  };
}

// 1% rule: every completed action counts 1% toward its goal's 100%.
// Small steps compound — the bar moves every day you show up.
export async function goalProgress(userId: string, goalId: string) {
  const tasks = await prisma.task.findMany({ where: { userId, goalId } });
  const done = tasks.filter((t) => t.status === "done").length;
  return { total: tasks.length, done, pct: Math.min(100, done) };
}
