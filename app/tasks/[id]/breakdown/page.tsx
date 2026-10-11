import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { simplifyTask } from "@/lib/ai";
import { confirmBreakdown } from "../../actions";

export const dynamic = "force-dynamic";

export default async function BreakdownPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const returnTo = from || "/today";
  const userId = await resolveUserId().catch(() => null);
  if (!userId) return <p>Database not connected.</p>;
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return <p>Task not found. <Link href={returnTo}>← Back</Link></p>;
  const existing = await prisma.task.findMany({ where: { parentId: id }, orderBy: { order: "asc" } });
  const { steps: proposed, provider } = await simplifyTask(task.title);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
      <Link href={returnTo}>← Back without saving</Link>
      <h1 style={{ fontSize: 24, margin: 0 }}>Break it down</h1>
      <p style={{ color: "#6B6B6B", margin: 0 }}>
        Task: <strong>{task.title}</strong> — edit the steps however you like, remove what doesn&apos;t fit, add your own. Nothing saves until you confirm.
      </p>
      {existing.length > 0 && (
        <div style={{ fontSize: 13, color: "#6B6B6B" }}>
          Already broken into {existing.length} step{existing.length === 1 ? "" : "s"} — saving adds these as more.
        </div>
      )}
      <form action={confirmBreakdown} style={{ display: "grid", gap: 8 }}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        {proposed.slice(0, 6).map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input name={`step-${i}`} defaultValue={s} maxLength={200} aria-label={`Step ${i + 1}`}
              style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          </div>
        ))}
        {[6, 7, 8].map((i) => (
          <input key={i} name={`step-${i}`} maxLength={200} placeholder={`Add your own step (optional)`} aria-label={`Extra step ${i - 5}`}
            style={{ minHeight: 44, borderRadius: 10, border: "1px dashed #C9C2B4", padding: "0 12px" }} />
        ))}
        <div style={{ fontSize: 12, color: "#6B6B6B" }}>Tip: clear a box to drop that step. Suggested by {provider} — fully yours to change.</div>
        <div>
          <button type="submit" style={{ minHeight: 48, padding: "0 28px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 700, fontSize: 16 }}>
            Save these steps ✓
          </button>
        </div>
      </form>
    </div>
  );
}
