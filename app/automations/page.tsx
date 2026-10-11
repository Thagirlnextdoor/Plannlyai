import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { ensureDefaultTemplates } from "@/lib/email";
import { GOAL_TEMPLATES } from "@/lib/workflows";
import { EmailComposer } from "./composer";
import { addTemplate, addWorkflow, deleteWorkflow, runWorkflowAction, templateGoal } from "./actions";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const userId = await resolveUserId().catch(() => null);
  if (!userId) return <p>Database not connected.</p>;
  const templates = await ensureDefaultTemplates(userId);
  const workflows = await prisma.workflow.findMany({ where: { userId }, orderBy: { name: "asc" }, include: { runs: { orderBy: { ranAt: "desc" }, take: 3 } } });
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Automations</h1>

      <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 4px" }}>Email composer</h2>
        <p style={{ fontSize: 13, color: "#6B6B6B" }}>Drafts in <Link href="/settings/voice">your voice</Link>. Nothing sends without your tap.</p>
        <EmailComposer />
      </section>

      <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>My templates ({templates.length})</h2>
        {templates.map((t) => <div key={t.id} style={{ fontSize: 14, margin: "4px 0" }}>📋 <strong>{t.name}</strong></div>)}
        <form action={addTemplate} style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input name="name" required maxLength={120} placeholder="Template name" style={{ flex: 1, minWidth: 140, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
            <input name="subject" maxLength={200} placeholder="Subject ({{topic}} {{name}} work too)" style={{ flex: 2, minWidth: 180, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          </div>
          <textarea name="body" required maxLength={4000} rows={2} placeholder="Body — use {{greeting}} {{name}} {{topic}} {{when}} {{notes}} {{signoff}}" style={{ borderRadius: 10, border: "1px solid #E8E4DC", padding: 12 }} />
          <div><button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff" }}>Save template</button></div>
        </form>
      </section>

      <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>Reusable workflows ({workflows.length})</h2>
        <p style={{ fontSize: 13, color: "#6B6B6B" }}>Describe it once in plain language — e.g. “Every Monday I review goals, check emails and plan my week”.</p>
        <form action={addWorkflow} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input name="text" required maxLength={1000} placeholder="Describe your routine…"
            style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          <button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>Save</button>
        </form>
        {workflows.length === 0 && <p style={{ color: "#6B6B6B" }}>None yet.</p>}
        {workflows.map((w) => {
          const steps = JSON.parse(w.steps) as string[];
          return (
            <div key={w.id} style={{ border: "1px solid #E8E4DC", borderRadius: 10, padding: 12, margin: "8px 0" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <strong style={{ flex: 1 }}>🔁 {w.name}</strong>
                <form action={runWorkflowAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <button type="submit" style={{ minHeight: 40, padding: "0 16px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>Run</button>
                </form>
                <form action={deleteWorkflow}>
                  <input type="hidden" name="id" value={w.id} />
                  <button type="submit" style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", color: "#DC2626" }}>Delete</button>
                </form>
              </div>
              <ol style={{ fontSize: 14, margin: "8px 0" }}>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              {w.runs.length > 0 && (
                <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                  Runs: {w.runs.map((r) => `${new Date(r.ranAt).toLocaleString()} (${r.result})`).join(" · ")}
                  <span style={{ background: "#FFF7E6", border: "1px solid #F5D9A0", color: "#8A5A00", borderRadius: 999, padding: "2px 8px", marginLeft: 8 }}>source: routine</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>Start from a goal template</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(GOAL_TEMPLATES).map(([key, t]) => (
            <form key={key} action={templateGoal}>
              <input type="hidden" name="key" value={key} />
              <button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", fontWeight: 600 }}>{t.label}: {t.title.slice(0, 28)}…</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
