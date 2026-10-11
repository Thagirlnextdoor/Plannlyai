import { prisma } from "@/lib/db";
import { acceptGoal, renameNode, deleteNode } from "../../actions";

export const dynamic = "force-dynamic";

async function loadTree(goalId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId } });
  if (!goal) return null;
  const milestones = await prisma.milestone.findMany({ where: { goalId }, orderBy: { order: "asc" } });
  const monthlies = await prisma.monthlyOutcome.findMany({ where: { milestoneId: { in: milestones.map((m) => m.id) } } });
  const weeklies = await prisma.weeklyObjective.findMany({ where: { monthlyId: { in: monthlies.map((m) => m.id) } } });
  const tasks = await prisma.task.findMany({ where: { goalId, parentId: null }, orderBy: { order: "asc" } });
  const subtasks = await prisma.task.findMany({ where: { goalId, parentId: { not: null } } });
  return { goal, milestones, monthlies, weeklies, tasks, subtasks };
}

function NodeRow({ kind, id, goalId, title }: { kind: string; id: string; goalId: string; title: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0", flexWrap: "wrap" }}>
      <form action={renameNode} style={{ display: "flex", gap: 6, flex: 1, minWidth: 240 }}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="goalId" value={goalId} />
        <input name="title" defaultValue={title} maxLength={200}
          style={{ flex: 1, minHeight: 40, borderRadius: 8, border: "1px solid #E8E4DC", padding: "0 12px" }} />
        <button type="submit" style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff" }}>Save</button>
      </form>
      <form action={deleteNode}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="goalId" value={goalId} />
        <button type="submit" aria-label={`Remove ${title}`} style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", color: "#DC2626" }}>Remove</button>
      </form>
    </div>
  );
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let tree;
  try {
    tree = await loadTree(id);
  } catch {
    return <p>Database not connected.</p>;
  }
  if (!tree) return <p>Goal not found.</p>;
  const { goal, milestones, monthlies, weeklies, tasks, subtasks } = tree;
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Let&apos;s break this down</h1>
      <p style={{ color: "#6B6B6B", margin: 0 }}>
        Goal: <strong>{goal.title}</strong> — edit anything, remove what doesn&apos;t fit, then accept.
      </p>
      {milestones.map((m) => (
        <section key={m.id} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Milestone</div>
          <NodeRow kind="milestone" id={m.id} goalId={goal.id} title={m.title} />
          {monthlies.filter((x) => x.milestoneId === m.id).map((mo) => (
            <div key={mo.id} style={{ marginLeft: 16 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Monthly</div>
              <NodeRow kind="monthly" id={mo.id} goalId={goal.id} title={mo.title} />
              {weeklies.filter((x) => x.monthlyId === mo.id).map((w) => (
                <div key={w.id} style={{ marginLeft: 16 }}>
                  <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Weekly</div>
                  <NodeRow kind="weekly" id={w.id} goalId={goal.id} title={w.title} />
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
      <section style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", color: "#6B6B6B" }}>Daily actions + tiny steps</div>
        {tasks.map((t) => (
          <div key={t.id}>
            <NodeRow kind="task" id={t.id} goalId={goal.id} title={t.title} />
            {subtasks.filter((s) => s.parentId === t.id).map((s) => (
              <div key={s.id} style={{ marginLeft: 24 }}>↳ {s.title}</div>
            ))}
          </div>
        ))}
      </section>
      <form action={acceptGoal.bind(null, goal.id)}>
        <button type="submit" style={{ minHeight: 48, borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 700, fontSize: 16, padding: "0 28px" }}>
          Looks good — start my plan ✓
        </button>
      </form>
    </div>
  );
}
