import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { goalProgress } from "@/lib/today";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const userId = await resolveUserId().catch(() => null);
  if (!userId) return <p>Database not connected.</p>;
  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 50 });
  const progress = await Promise.all(goals.map(async (g) => {
    const next = await prisma.task.findFirst({ where: { userId, goalId: g.id, status: { in: ["todo", "doing"] } }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return { goal: g, next, ...await goalProgress(userId, g.id) };
  }));
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Goals</h1>
      {progress.length === 0 && <p>No goals yet. <Link href="/goals/new">Create your first goal</Link>.</p>}
      {progress.map(({ goal: g, next, pct, done }) => (
        <div key={g.id} style={{ background: "#fff", border: "1px solid #E8E4DC", borderLeft: "4px solid #0F766E", borderRadius: 12, padding: 16 }}>
          <Link href={`/goals/${g.id}`} style={{ textDecoration: "none", color: "inherit" }}><strong>{g.title}</strong></Link>
          {g.outcome && <div style={{ fontSize: 13, color: "#6B6B6B" }}>{g.outcome}</div>}
          <div role="img" aria-label={`${g.title}: ${pct} percent complete`} style={{ height: 8, background: "#EDEBE5", borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#15803D" }} />
          </div>
          <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>{pct}% · {done} actions × 1%</div>
          <div style={{ marginTop: 10 }}>
            <Link
              href={next ? `/today` : `/goals/${g.id}`}
              style={{ display: "inline-block", minHeight: 44, lineHeight: "44px", padding: "0 18px", borderRadius: 999, background: "#EFF6F5", color: "#0F766E", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
            >
              {next ? `Next: ${next.title.length > 42 ? next.title.slice(0, 42) + "…" : next.title} →` : `Done — review plan →`}
            </Link>
          </div>
        </div>
      ))}
      <p><Link href="/goals/new">+ New goal</Link></p>
    </div>
  );
}
