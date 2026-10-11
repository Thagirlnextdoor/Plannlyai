import nodemailer from "nodemailer";
import { prisma } from "./db";
import { aiRateLimit } from "./ratelimit";

export interface DraftInput {
  to: string;
  purpose: string;
  notes?: string;
}

export interface Draft {
  to: string;
  subject: string;
  body: string;
  templateUsed: string;
  voiceUsed: boolean;
  provider: string;
}

const DEFAULT_TEMPLATES = [
  { name: "Meeting confirmation", subject: "Confirmed: {{topic}}", body: "{{greeting}} {{name}},\n\nConfirming {{topic}} on {{when}}.\n\n{{signoff}}" },
  { name: "Follow-up", subject: "Following up: {{topic}}", body: "{{greeting}} {{name}},\n\nJust following up on {{topic}}. {{notes}}\n\n{{signoff}}" },
  { name: "Client check-in", subject: "Checking in", body: "{{greeting}} {{name}},\n\nHope you're well. {{notes}}\n\n{{signoff}}" },
  { name: "Thank-you", subject: "Thank you", body: "{{greeting}} {{name}},\n\nThank you for {{topic}}. {{notes}}\n\n{{signoff}}" },
];

export async function getVoice(userId: string) {
  return prisma.voiceProfile.findUnique({ where: { userId } });
}

export async function saveVoice(userId: string, v: { tone?: string; formality?: string; greeting?: string; signoff?: string; samples?: string }) {
  return prisma.voiceProfile.upsert({ where: { userId }, update: v, create: { userId, ...v } });
}

export async function ensureDefaultTemplates(userId: string) {
  const count = await prisma.emailTemplate.count({ where: { userId } });
  if (count === 0) {
    await prisma.emailTemplate.createMany({ data: DEFAULT_TEMPLATES.map((t) => ({ userId, ...t })) });
  }
  return prisma.emailTemplate.findMany({ where: { userId } });
}

function pickTemplate(templates: { name: string; subject: string | null; body: string }[], purpose: string) {
  const p = purpose.toLowerCase();
  const byName = (re: RegExp) => templates.find((t) => re.test(t.name));
  if (/(confirm|schedul|meet|appoint)/.test(p)) return byName(/confirm|schedul|meet/i) ?? templates[0];
  if (/(follow|nudge|remind)/.test(p)) return byName(/follow/i) ?? templates[0];
  if (/(check.in|hello|^hi\b|touch base)/.test(p)) return byName(/check-in/i) ?? templates[0];
  if (/thank/.test(p)) return byName(/thank/i) ?? templates[0];
  return templates[0];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}

async function ollamaPolish(draft: string, voiceNote: string): Promise<string | null> {
  try {
    const host = process.env.OLLAMA_HOST ?? "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model, stream: false,
        messages: [
          { role: "system", content: `Rewrite the email draft to match this voice: ${voiceNote}. Keep meaning, stay concise. Reply with the rewritten email only.` },
          { role: "user", content: draft },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { message?: { content?: string } };
    return json.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// Drafts only — never sends. Returns the source (template + voice) for the badge.
export async function draftEmail(userId: string, input: DraftInput): Promise<Draft> {
  const voice = await getVoice(userId);
  const templates = await ensureDefaultTemplates(userId);
  const t = pickTemplate(templates.map((x) => ({ name: x.name, subject: x.subject, body: x.body })), input.purpose);
  const greeting = voice?.greeting || "Hi";
  const signoff = voice?.signoff || "Best regards";
  const vars = {
    greeting, signoff,
    name: input.to.split("@")[0] || "there",
    topic: input.purpose,
    when: "the agreed time",
    notes: input.notes ?? "",
  };
  const subject = fill(t.subject || input.purpose, vars);
  let body = fill(t.body, vars);
  let provider = "offline";
  if ((process.env.AI_PROVIDER ?? "offline") === "ollama" && voice && aiRateLimit(`email:${userId}`)) {
    const polished = await ollamaPolish(body, `tone=${voice.tone ?? "?"} formality=${voice.formality ?? "?"} greeting=${greeting} signoff=${signoff} samples: ${(voice.samples ?? "").slice(0, 500)}`);
    if (polished) { body = polished; provider = "ollama"; }
    else provider = "offline-fallback";
  }
  return { to: input.to, subject, body, templateUsed: t.name, voiceUsed: !!voice, provider };
}

// Human-gated send: only called from an explicit Send button. No auto-send path.
export async function sendEmail(userId: string, draft: { to: string; subject: string; body: string }): Promise<{ sent: boolean; reason: string }> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { sent: false, reason: "Email sending isn't configured (free Gmail SMTP) — copy the draft into your mail app for now." };
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({ from: process.env.SMTP_USER, to: draft.to, subject: draft.subject, text: draft.body });
  await prisma.eventLog.create({ data: { userId, type: "email.sent", data: JSON.stringify({ to: draft.to, subject: draft.subject }) } });
  return { sent: true, reason: "Sent." };
}
