import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { goalProgress, listToday } from "@/lib/today";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await resolveUserId().catch(() => null);
  if (!userId) return <p>Database not connected.</p>;
  const [goals, today] = await Promise.all([
    prisma.goal.findMany({ where: { userId, status: "active" }, take: 6, orderBy: { updatedAt: "desc" } }),
    listToday(userId),
  ]);
  const progress = await Promise.all(goals.map(async (g) => ({ goal: g, ...await goalProgress(userId, g.id) })));
  const weekOut = new Date();
  weekOut.setDate(weekOut.getDate() + 7);
  const upcoming = await prisma.event.findMany({
    where: { userId, startsAt: { gte: new Date(), lte: weekOut } },
    orderBy: { startsAt: "asc" },
    take: 5,
  });
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 13, textTransform: "uppercase", color: "#6B6B6B" }}>What am I working toward?</h2>
          {progress.length === 0 && <p>No active goals. <Link href="/goals/new">Create one</Link>.</p>}
          {progress.map(({ goal, pct, done, total }) => (
            <div key={goal.id} style={{ margin: "10px 0" }}>
              <Link href={`/goals/${goal.id}`} style={{ fontWeight: 600 }}>{goal.title}</Link>
              <div role="img" aria-label={`${goal.title}: ${pct} percent complete`} style={{ height: 8, background: "#EDEBE5", borderRadius: 999, overflow: "hidden", marginTop: 4 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "#15803D" }} />
              </div>
              <div style={{ fontSize: 12, color: "#6B6B6B" }}>{pct}% · {done} actions × 1%</div>
            </div>
          ))}
        </section>
        <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 13, textTransform: "uppercase", color: "#6B6B6B" }}>What matters today?</h2>
          {today.priorities.length === 0 ? <p>Nothing queued. <Link href="/today">Today</Link> is clear.</p> : (
            <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
              {today.priorities.map((t) => (
                <li key={t.id} style={{ margin: "4px 0" }}>
                  {t.title}
                  {t.goalTitle && <span style={{ color: "#6B6B6B" }}> — for {t.goalTitle}</span>}
                </li>
              ))}
            </ul>
          )}
          {today.done.length > 0 && (
            <>
              <h2 style={{ fontSize: 13, textTransform: "uppercase", color: "#6B6B6B", marginTop: 16 }}>What you&apos;ve done ✓</h2>
              <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
                {today.done.slice(0, 3).map((t) => (
                  <li key={t.id} style={{ margin: "4px 0", color: "#15803D" }}>
                    {t.title}
                    {t.goalTitle && <span style={{ color: "#6B6B6B" }}> — {t.goalTitle}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 style={{ fontSize: 13, textTransform: "uppercase", color: "#6B6B6B", marginTop: 16 }}>Coming up (7 days)</h2>
          {upcoming.length === 0 ? <p>Nothing scheduled.</p> :
            upcoming.map((e) => <p key={e.id} style={{ margin: "6px 0" }}>• {e.title} — {new Date(e.startsAt).toLocaleDateString()}</p>)}
          <h2 style={{ fontSize: 13, textTransform: "uppercase", color: "#6B6B6B", marginTop: 16 }}>Am I making progress?</h2>
          <p>{today.doneCount} of {today.total} actions done.</p>
        </section>
      </div>
    </div>
  );
}
