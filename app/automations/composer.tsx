"use client";
import { useActionState } from "react";
import Link from "next/link";
import { composeDraft, sendDraft, type ComposeState } from "./actions";

const EMPTY: ComposeState = {};

export function EmailComposer() {
  const [draft, compose] = useActionState(composeDraft, EMPTY);
  const [result, send] = useActionState(sendDraft, EMPTY);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <form action={compose} style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input name="to" required maxLength={200} placeholder="To (email or name)" style={{ flex: 1, minWidth: 160, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
          <input name="purpose" required maxLength={300} placeholder="Purpose: e.g. follow up on Tuesday's call" style={{ flex: 2, minWidth: 200, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
        </div>
        <input name="notes" maxLength={1000} placeholder="Extra details (optional)" style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
        <div>
          <button type="submit" style={{ minHeight: 44, padding: "0 20px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>Draft it</button>
        </div>
      </form>
      {draft.error && <p style={{ color: "#DC2626" }}>{draft.error}</p>}
      {draft.subject && (
        <div style={{ border: "1px solid #E8E4DC", borderRadius: 10, padding: 12, background: "#F7F6F3" }}>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            <span style={{ background: "#FFF7E6", border: "1px solid #F5D9A0", color: "#8A5A00", borderRadius: 999, padding: "3px 10px" }}>
              📋 {draft.templateUsed} · {draft.voiceUsed ? "✉️ Your voice" : "✉️ Default voice"} · {draft.provider}
            </span>{" "}
            <Link href="/settings/voice" style={{ fontSize: 12 }}>Edit voice</Link>
          </div>
          <div style={{ fontWeight: 600 }}>{draft.subject}</div>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14 }}>{draft.body}</pre>
          <form action={send} style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <input name="to" required defaultValue={draft.to} placeholder="Recipient email to send" style={{ flex: 1, minWidth: 180, minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} />
            <input type="hidden" name="subject" value={draft.subject} />
            <input type="hidden" name="body" value={draft.body} />
            <button type="submit" style={{ minHeight: 44, padding: "0 20px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", fontWeight: 600 }}>Send (you approve)</button>
          </form>
          {result.reason && <p style={{ fontSize: 13 }}>{result.sent ? "✅ " : "ℹ️ "}{result.reason}</p>}
          {result.error && <p style={{ color: "#DC2626" }}>{result.error}</p>}
        </div>
      )}
    </div>
  );
}
