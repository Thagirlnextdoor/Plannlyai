import { createGoalWithPlan } from "../actions";

export default function NewGoalPage() {
  return (
    <div style={{ maxWidth: 560, display: "grid", gap: 14 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Tell us what you want to accomplish</h1>
      <p style={{ color: "#6B6B6B", margin: 0 }}>Use your own words — we&apos;ll suggest a plan you can review and change.</p>
      <form action={createGoalWithPlan} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 4 }}>Goal
          <input name="title" required minLength={3} maxLength={200} placeholder="e.g. Launch my online coaching business this year"
            style={{ minHeight: 48, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px", fontSize: 15 }} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>Desired outcome <span style={{ fontSize: 12, color: "#6B6B6B" }}>(optional)</span>
          <input name="outcome" maxLength={500} placeholder="e.g. First 3 paying clients"
            style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ display: "grid", gap: 4, flex: 1 }}>Target date
            <input name="targetDate" type="date" style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
          </label>
          <label style={{ display: "grid", gap: 4, flex: 1 }}>Hours / week
            <input name="hoursPerWeek" type="number" min={1} max={80} placeholder="e.g. 5"
              style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
          </label>
        </div>
        <label style={{ display: "grid", gap: 4 }}>Anything else we should know? <span style={{ fontSize: 12, color: "#6B6B6B" }}>(optional)</span>
          <textarea name="context" rows={3} maxLength={1000} placeholder="e.g. I only have evenings free"
            style={{ borderRadius: 10, border: "1px solid #E8E4DC", padding: 14 }} />
        </label>
        <button type="submit" style={{ minHeight: 48, borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 700, fontSize: 16 }}>
          Create my suggested plan →
        </button>
      </form>
    </div>
  );
}
