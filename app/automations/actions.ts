"use server";
import { z } from "zod";
import { resolveUserId } from "@/lib/session";
import { draftEmail, ensureDefaultTemplates, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { GOAL_TEMPLATES, createGoalFromTemplate, createWorkflow, parseWorkflowRequest, runWorkflow } from "@/lib/workflows";
import { redirect } from "next/navigation";

export interface ComposeState {
  to?: string;
  subject?: string;
  body?: string;
  templateUsed?: string;
  voiceUsed?: boolean;
  provider?: string;
  sent?: boolean;
  reason?: string;
  error?: string;
}

const Compose = z.object({
  to: z.string().trim().min(3).max(200),
  purpose: z.string().trim().min(2).max(300),
  notes: z.string().trim().max(1000).optional(),
});

export async function composeDraft(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  const parsed = Compose.safeParse({ to: formData.get("to"), purpose: formData.get("purpose"), notes: formData.get("notes") || undefined });
  if (!parsed.success) return { error: "Please add a recipient and purpose." };
  const userId = await resolveUserId();
  const d = await draftEmail(userId, parsed.data);
  return { to: parsed.data.to, subject: d.subject, body: d.body, templateUsed: d.templateUsed, voiceUsed: d.voiceUsed, provider: d.provider };
}

export async function sendDraft(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  const to = String(formData.get("to") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!to || !subject || !body) return { error: "Compose a draft first." };
  const res = await sendEmail(await resolveUserId(), { to, subject, body });
  return { subject, body, sent: res.sent, reason: res.reason };
}

const NewTemplate = z.object({
  name: z.string().trim().min(2).max(120),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(2).max(4000),
});

export async function addTemplate(formData: FormData) {
  const parsed = NewTemplate.safeParse({ name: formData.get("name"), subject: formData.get("subject") || undefined, body: formData.get("body") });
  if (!parsed.success) return;
  const userId = await resolveUserId();
  await ensureDefaultTemplates(userId);
  await prisma.emailTemplate.create({ data: { userId, ...parsed.data } });
}

export async function addWorkflow(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim().slice(0, 1000);
  if (!text) return;
  const userId = await resolveUserId();
  const { name, steps } = parseWorkflowRequest(text);
  await createWorkflow(userId, name, steps, "manual");
}

export async function runWorkflowAction(formData: FormData) {
  const id = String(formData.get("id"));
  await runWorkflow(await resolveUserId(), id);
}

export async function deleteWorkflow(formData: FormData) {
  const id = String(formData.get("id"));
  const userId = await resolveUserId();
  await prisma.workflowRun.deleteMany({ where: { workflowId: id, workflow: { userId } } });
  await prisma.workflow.deleteMany({ where: { id, userId } });
}

export async function templateGoal(formData: FormData) {
  const key = String(formData.get("key"));
  if (!GOAL_TEMPLATES[key]) return;
  const goal = await createGoalFromTemplate(await resolveUserId(), key);
  redirect(`/goals/${goal.id}/review`);
}
