import Link from "next/link";
import { getVoice } from "@/lib/email";
import { resolveUserId } from "@/lib/session";
import { updateVoice } from "./actions";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const userId = await resolveUserId().catch(() => null);
  const voice = userId ? await getVoice(userId).catch(() => null) : null;
  return (
    <div style={{ maxWidth: 560, display: "grid", gap: 14 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Your voice</h1>
      <p style={{ color: "#6B6B6B", margin: 0 }}>Drafts will sound like you — not a generic template. You always approve before anything sends.</p>
      <form action={updateVoice} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>Tone
            <input name="tone" defaultValue={voice?.tone ?? ""} maxLength={120} placeholder="e.g. warm, direct"
              style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} /></label>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>Formality
            <input name="formality" defaultValue={voice?.formality ?? ""} maxLength={60} placeholder="e.g. casual"
              style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} /></label>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>Greeting
            <input name="greeting" defaultValue={voice?.greeting ?? "Hi"} maxLength={60}
              style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} /></label>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>Sign-off
            <input name="signoff" defaultValue={voice?.signoff ?? "Best regards"} maxLength={120}
              style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 12px" }} /></label>
        </div>
        <label style={{ display: "grid", gap: 4 }}>Paste 1–2 emails you actually sent <span style={{ fontSize: 12, color: "#6B6B6B" }}>(kept private on your device)</span>
          <textarea name="samples" rows={4} maxLength={4000} defaultValue={voice?.samples ?? ""} placeholder="Hi Sarah, confirming..."
            style={{ borderRadius: 10, border: "1px solid #E8E4DC", padding: 12 }} /></label>
        <button type="submit" style={{ minHeight: 48, borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 700 }}>Save my voice</button>
      </form>
      <p><Link href="/automations">→ Draft an email</Link></p>
    </div>
  );
}
