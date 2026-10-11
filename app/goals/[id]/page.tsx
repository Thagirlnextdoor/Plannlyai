import Link from "next/link";
import { prisma } from "@/lib/db";
import { toggleTask } from "../actions";

export const dynamic = "force-dynamic";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goal = await prisma.goal.findFirst({ where: { id } }).catch(() => null);
  if (!goal) return <p>Goal not found or database offline.</p>;
  const milestones = await prisma.milestone.findMany({ where: { goalId: id }, orderBy: { order: "asc" } });
  const tasks = await prisma.task.findMany({ where: { goalId: id, parentId: null }, orderBy: { order: "asc" } });
  const subtasks = await prisma.task.findMany({ where: { goalId: id, parentId: { not: null } } });
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = Math.min(100, done); // 1% rule: each completed action = 1% of the goal
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <Link href="/goals">← All goals</Link>
      <h1 style={{ fontSize: 24, margin: 0 }}>{goal.title}</h1>
      {goal.outcome && <p style={{ color: "#6B6B6B", margin: 0 }}>Why: {goal.outcome}</p>}
      <div role="img" aria-label={`Goal ${pct} percent complete`} style={{ height: 10, background: "#EDEBE5", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#15803D" }} />
      </div>
      <div style={{ fontSize: 13, color: "#6B6B6B" }}>{pct}% — every completed action counts 1% toward 100%.</div>
      <h2 style={{ fontSize: 16, margin: "8px 0 0" }}>Milestones</h2>
      {milestones.map((m) => <div key={m.id} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>• {m.title}</div>)}
      <h2 style={{ fontSize: 16, margin: "8px 0 0" }}>Actions</h2>
      {tasks.map((t) => (
        <div key={t.id} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <strong style={{ flex: 1 }}>{t.title}</strong>
            <span style={{ fontSize: 12, color: "#6B6B6B" }}>{t.status} · {t.estimateMin ?? 25}m</span>
          </div>
          {subtasks.filter((s) => s.parentId === t.id).map((s) => <div key={s.id} style={{ marginLeft: 20, fontSize: 14 }}>↳ {s.title}</div>)}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <form action={toggleTask}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" style={{ minHeight: 40, padding: "0 16px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>
                {t.status === "done" ? "Reopen" : "✓ Complete"}
              </button>
            </form>
            <Link href={`/tasks/${t.id}/breakdown?from=/goals/${id}`} style={{ minHeight: 40, padding: "10px 16px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", textDecoration: "none", color: "#1E1E1E" }}>⤷ Make smaller</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
