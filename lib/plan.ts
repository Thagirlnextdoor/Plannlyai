import { prisma } from "./db";
import type { PlanNode } from "./ai";

// Persist a generated plan tree: milestones -> monthlies -> weeklies -> tasks.
export async function persistPlan(userId: string, goalId: string, nodes: PlanNode[]) {
  let order = 0;
  for (const m of nodes.filter((n) => n.type === "milestone")) {
    const milestone = await prisma.milestone.create({
      data: { goalId, title: m.title, order: order++ },
    });
    for (const mo of (m.children ?? []).filter((n) => n.type === "monthly")) {
      const monthlyRow = await prisma.monthlyOutcome.create({
        data: { milestoneId: milestone.id, title: mo.title },
      });
      for (const w of (mo.children ?? []).filter((n) => n.type === "weekly")) {
        const weekly = await prisma.weeklyObjective.create({
          data: { monthlyId: monthlyRow.id, title: w.title },
        });
        void weekly;
        for (const d of (w.children ?? []).filter((n) => n.type === "daily" || n.type === "tiny")) {
          const task = await prisma.task.create({
            data: { userId, goalId, title: d.title, type: d.type, estimateMin: d.estimateMin ?? (d.type === "tiny" ? 5 : 25), dueAt: d.dueAt, order: 0, source: "plan" },
          });
          for (const t of (d.children ?? []).filter((n) => n.type === "tiny")) {
            await prisma.task.create({
              data: { userId, goalId, parentId: task.id, title: t.title, type: "tiny", estimateMin: t.estimateMin ?? 5, dueAt: t.dueAt, order: 0, source: "plan" },
            });
          }
        }
      }
    }
  }
}
