export function DailyBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      role="status"
      aria-label={`Daily progress: ${done} of ${total} done, ${pct} percent complete`}
      style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 999, padding: "10px 16px", display: "flex", gap: 12, alignItems: "center" }}
    >
      <strong>Today</strong>
      <div style={{ flex: 1, height: 10, background: "#EDEBE5", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#0F766E", borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 13, color: "#6B6B6B" }}>{done} of {total} done</span>
    </div>
  );
}
