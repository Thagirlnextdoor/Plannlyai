"use client";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, margin: 0 }}>Something hiccuped — nothing is lost.</h1>
      <p style={{ color: "#6B6B6B" }}>{error.message || "An unexpected error occurred."}</p>
      <div>
        <button onClick={reset} style={{ minHeight: 44, padding: "0 20px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>
          Try again
        </button>
      </div>
    </div>
  );
}
