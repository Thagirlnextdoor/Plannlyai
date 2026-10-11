import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { sendMessage } from "./actions";

export const dynamic = "force-dynamic";

const CHIPS = ["/today", "/smaller", "/replan 20 min", "/recover", "/why"];

export default async function AssistantPage() {
  const userId = await resolveUserId().catch(() => null);
  let messages: { id: string; role: string; body: string }[] = [];
  if (userId) {
    const thread = await prisma.assistantThread.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } } });
    messages = thread?.messages ?? [];
  }
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Assistant</h1>
      <p style={{ color: "#6B6B6B", margin: 0 }}>Ask in your own words. Try: “I only have 20 min today”, “I fell behind”, “Why is this on my list?”</p>
      <div style={{ border: "1px solid #E8E4DC", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
        {messages.length === 0 && <div style={{ padding: 16, color: "#6B6B6B" }}>No conversation yet — say hello below. 👋</div>}
        {messages.map((m) => (
          <div key={m.id} style={{ padding: "12px 14px", background: m.role === "assistant" ? "#F1F8F7" : "#fff", textAlign: m.role === "user" ? "right" : "left", whiteSpace: "pre-wrap" }}>
            {m.body}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, padding: 12, flexWrap: "wrap", borderTop: "1px solid #E8E4DC" }}>
          {CHIPS.map((c) => (
            <form key={c} action={sendMessage}>
              <input type="hidden" name="body" value={c} />
              <button type="submit" style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid #E8E4DC", background: "#fff", fontSize: 13 }}>{c}</button>
            </form>
          ))}
        </div>
        <form action={sendMessage} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #E8E4DC" }}>
          <input name="body" required maxLength={2000} placeholder="What should I focus on today?"
            style={{ flex: 1, minHeight: 44, borderRadius: 999, border: "1px solid #E8E4DC", padding: "0 16px" }} />
          <button type="submit" style={{ minHeight: 44, padding: "0 20px", borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}>Send</button>
        </form>
      </div>
    </div>
  );
}
