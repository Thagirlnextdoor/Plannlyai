import Link from "next/link";
import { DailyBar } from "@/components/DailyBar";
import { toggleTask } from "../goals/actions";
import { listToday } from "@/lib/today";
import { resolveUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  let data;
  try {
    data = await listToday(await resolveUserId());
  } catch {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <DailyBar done={0} total={0} />
        <p>Database not connected yet.</p>
      </div>
    );
  }
  const { priorities, quickWins, scheduled, done, doneCount, total } = data;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <DailyBar done={doneCount} total={total} />
      <h1 style={{ fontSize: 24, margin: 0 }}>What do I actually need to focus on today?</h1>

      <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Today&apos;s priorities (max 3)</div>
      {priorities.length === 0 && <p>No open actions. <Link href="/goals/new">Create a goal</Link> to get your first plan.</p>}
      {priorities.map((t) => (
        <div key={t.id} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
          <strong>{t.title}</strong>
          <div style={{ fontSize: 13, color: "#6B6B6B" }}>{t.goalTitle ? `Contributes to: ${t.goalTitle}` : "Quick action"}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <form action={toggleTask}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>✓ Complete</button>
            </form>
            <Link href={`/tasks/${t.id}/breakdown?from=/today`} style={{ minHeight: 44, padding: "12px 18px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", textDecoration: "none", color: "#1E1E1E" }}>⤷ Break down</Link>
          </div>
        </div>
      ))}

      {quickWins.length > 0 && (
        <>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Quick wins (≤ 5 min)</div>
          {quickWins.map((t) => (
            <div key={t.id} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ flex: 1 }}>⚡ {t.title}</span>
              <form action={toggleTask}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" style={{ minHeight: 40, padding: "0 16px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>✓</button>
              </form>
            </div>
          ))}
        </>
      )}

      {scheduled.length > 0 && (
        <>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Scheduled today</div>
          {scheduled.map((e) => (
            <div key={e.id} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
              🕑 {e.title} <span style={{ fontSize: 13, color: "#6B6B6B" }}>· {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </>
      )}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Done today 🎉</div>
          {done.slice(0, 5).map((t) => <div key={t.id} style={{ fontSize: 14, color: "#15803D" }}>✓ {t.title}</div>)}
        </>
      )}
      <p><Link href="/goals/new">+ New goal</Link></p>
    </div>
  );
}
