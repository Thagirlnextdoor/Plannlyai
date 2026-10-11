function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 18 }}>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em", color: "#6B6B6B", margin: "0 0 12px" }}>{title}</h2>
      {children}
    </div>
  );
}

export default function DesignPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Design system (live)</h1>
      <p style={{ color: "#6B6B6B", margin: 0 }}>Tokens + components from Phase D, rendered by the app. Full static mock: <code>design.html</code>.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Buttons — forward only">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>✓ Complete</button>
            <button style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, background: "#fff", border: "1px solid #E8E4DC", fontWeight: 600 }}>⤷ Break down</button>
            <button style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, background: "transparent", color: "#0F766E", fontWeight: 600 }}>▶ Start</button>
          </div>
        </Card>
        <Card title="Progress">
          <div style={{ height: 10, background: "#EDEBE5", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "35%", background: "#15803D" }} />
          </div>
          <p style={{ fontSize: 13, color: "#6B6B6B" }}>Goal 35% · daily bar lives on every page (see Today).</p>
        </Card>
      </div>
    </div>
  );
}
