import Link from "next/link";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>{title}</h1>
      <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 18 }}>{children}</div>
      <p><Link href="/today">← Back to Today</Link></p>
    </div>
  );
}

export function TasksShell() { return <Shell title="Tasks"><p>Full task views ship in Phase 1–2. Today stays the curated entry point.</p></Shell>; }
export function CalendarShell() { return <Shell title="Calendar"><p>Scheduling assistance ships in Phase 4.</p></Shell>; }
export function AutomationsShell() { return <Shell title="Automations"><p>Reusable workflows + templates ship in Phase 6.</p></Shell>; }
export function AssistantShell() { return <Shell title="Assistant"><p>Natural-language planning + recovery ship in Phase 3.</p></Shell>; }
