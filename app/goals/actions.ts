"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { generatePlan } from "@/lib/ai";
import { persistPlan } from "@/lib/plan";

const NewGoal = z.object({
  title: z.string().trim().min(3).max(200),
  outcome: z.string().trim().max(500).optional(),
  targetDate: z.string().trim().optional(),
  hoursPerWeek: z.coerce.number().min(1).max(80).optional(),
  context: z.string().trim().max(1000).optional(),
});

export async function createGoalWithPlan(formData: FormData) {
  const parsed = NewGoal.safeParse({
    title: formData.get("title"),
    outcome: formData.get("outcome") || undefined,
    targetDate: formData.get("targetDate") || undefined,
    hoursPerWeek: formData.get("hoursPerWeek") || undefined,
    context: formData.get("context") || undefined,
  });
  if (!parsed.success) redirect("/goals/new?error=invalid");
  const userId = await resolveUserId();
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: parsed.data.title,
      outcome: parsed.data.outcome,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
    },
  });
  const { nodes, provider } = await generatePlan({
    goalTitle: parsed.data.title,
    targetDate: parsed.data.targetDate,
    hoursPerWeek: parsed.data.hoursPerWeek,
    context: [parsed.data.outcome, parsed.data.context].filter(Boolean).join(". "),
  }, userId);
  await persistPlan(userId, goal.id, nodes);
  await prisma.eventLog.create({ data: { userId, type: "goal.created", data: JSON.stringify({ goalId: goal.id, provider }) } });
  redirect(`/goals/${goal.id}/review`);
}

export async function acceptGoal(goalId: string) {
  const userId = await resolveUserId();
  await prisma.goal.updateMany({ where: { id: goalId, userId }, data: { status: "active" } });
  await prisma.eventLog.create({ data: { userId, type: "goal.accepted", data: JSON.stringify({ goalId }) } });
  revalidatePath("/goals");
  redirect(`/goals/${goalId}`);
}

export async function renameNode(formData: FormData) {
  const kind = String(formData.get("kind"));
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const goalId = String(formData.get("goalId"));
  if (!title) redirect(`/goals/${goalId}/review`);
  if (kind === "task") await prisma.task.updateMany({ where: { id }, data: { title } });
  if (kind === "milestone") await prisma.milestone.updateMany({ where: { id }, data: { title } });
  if (kind === "monthly") await prisma.monthlyOutcome.updateMany({ where: { id }, data: { title } });
  if (kind === "weekly") await prisma.weeklyObjective.updateMany({ where: { id }, data: { title } });
  revalidatePath(`/goals/${goalId}`);
  redirect(`/goals/${goalId}/review`);
}

export async function deleteNode(formData: FormData) {
  const kind = String(formData.get("kind"));
  const id = String(formData.get("id"));
  const goalId = String(formData.get("goalId"));
  if (kind === "task") await prisma.task.deleteMany({ where: { id } });
  if (kind === "milestone") await prisma.milestone.deleteMany({ where: { id } });
  if (kind === "monthly") await prisma.monthlyOutcome.deleteMany({ where: { id } });
  if (kind === "weekly") await prisma.weeklyObjective.deleteMany({ where: { id } });
  revalidatePath(`/goals/${goalId}`);
  redirect(`/goals/${goalId}/review`);
}

export async function toggleTask(formData: FormData) {
  const id = String(formData.get("id"));
  const userId = await resolveUserId();
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return;
  await prisma.task.update({ where: { id }, data: { status: task.status === "done" ? "todo" : "done" } });
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
}
