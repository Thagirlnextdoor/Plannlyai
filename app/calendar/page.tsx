import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { nudgeText, runDueReminders } from "@/lib/reminders";
import { addEvent, addEventFromText, addFollowUp, dismissReminder } from "./actions";
import { toggleTask } from "../goals/actions";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const userId = await resolveUserId().catch(() => null);
  if (!userId) return <p>Database not connected.</p>;
  const [events, reminders, openTasks] = await Promise.all([
    prisma.event.findMany({ where: { userId, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 20 }),
    prisma.reminder.findMany({ where: { userId, status: { in: ["active", "nudged"] } }, orderBy: { nextRunAt: "asc" }, take: 20, include: { task: true, runs: true } }),
    prisma.task.findMany({ where: { userId, status: { in: ["todo", "doing"] } }, orderBy: { order: "asc" }, take: 20 }),
  ]);
  // Surface anything due right now (idempotent — safe on every page view).
  const dueNow = await runDueReminders(userId).catch(() => []);
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Calendar & reminders</h1>

      {dueNow.length > 0 && (
        <section style={{ background: "#FFF7E6", border: "1px solid #F5D9A0", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "#8A5A00" }}>Needs your attention</div>
          {dueNow.map((n) => (
            <div key={n.reminderId} style={{ margin: "10px 0" }}>
              <div>{nudgeText(n)}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {n.taskId && (
                  <>
                    <form action={toggleTask}>
                      <input type="hidden" name="id" value={n.taskId} />
                      <button type="submit" style={{ minHeight: 40, padding: "0 16px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>Do now</button>
                    </form>
                    <Link href={`/tasks/${n.taskId}/breakdown?from=/calendar`} style={{ minHeight: 40, padding: "10px 16px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", textDecoration: "none", color: "#1E1E1E" }}>Make smaller</Link>
                  </>
                )}
                <Link href="/assistant" style={{ minHeight: 40, padding: "10px 16px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", textDecoration: "none", color: "#1E1E1E" }}>Ask assistant</Link>
                <form action={dismissReminder}>
                  <input type="hidden" name="id" value={n.reminderId} />
                  <button type="submit" style={{ minHeight: 40, padding: "0 16px", borderRadius: 999, background: "transparent", color: "#6B6B6B" }}>Dismiss</button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>Upcoming</h2>
        {events.length === 0 && <p style={{ color: "#6B6B6B" }}>Nothing scheduled.</p>}
        {events.map((e) => <p key={e.id} style={{ margin: "6px 0" }}>• {e.title} — {new Date(e.startsAt).toLocaleString()}</p>)}
        <form action={addEvent} style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <input name="title" required minLength={2} maxLength={200} placeholder="Meeting title" style={{ flex: 2, minWidth: 160, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          <input name="date" type="date" required style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          <input name="time" type="time" defaultValue="10:00" style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          <button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>Add</button>
        </form>
        <form action={addEventFromText} style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input name="text" maxLength={200} placeholder='Or natural language: "Schedule call with Sarah tomorrow"'
            style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          <button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff" }}>Schedule</button>
        </form>
      </section>

      <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>Follow-up reminders</h2>
        {reminders.length === 0 && <p style={{ color: "#6B6B6B" }}>No active reminders.</p>}
        {reminders.map((r) => (
          <div key={r.id} style={{ margin: "6px 0", fontSize: 14 }}>
            • {r.context} {r.task ? `(on “${r.task.title}”)` : ""} — runs: {r.runs.length} · {r.status}
          </div>
        ))}
        <form action={addFollowUp} style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <input name="text" required minLength={2} maxLength={300} placeholder='e.g. "Follow up with John"' style={{ flex: 2, minWidth: 160, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          <label style={{ fontSize: 13 }}>in <input name="days" type="number" min={0} max={365} defaultValue={3} style={{ width: 64, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 8px" }} /> days</label>
          <select name="taskId" defaultValue="" style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 8px" }}>
            <option value="">No task link</option>
            {openTasks.map((t) => <option key={t.id} value={t.id}>{t.title.slice(0, 40)}</option>)}
          </select>
          <button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>Remind me</button>
        </form>
      </section>
    </div>
  );
}
