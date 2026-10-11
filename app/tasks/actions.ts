"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

// Saves user-reviewed substeps (edited, removed, added) as subtasks.
export async function confirmBreakdown(formData: FormData) {
  const id = String(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/today");
  const userId = await resolveUserId();
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) redirect(returnTo);
  const steps: string[] = [];
  for (let i = 0; i < 12; i++) {
    const s = String(formData.get(`step-${i}`) ?? "").trim().slice(0, 200);
    if (s) steps.push(s);
  }
  if (steps.length) {
    let order = 0;
    for (const s of steps) {
      await prisma.task.create({
        data: { userId, goalId: task.goalId, parentId: task.id, title: s, type: "tiny", estimateMin: 5, order: order++, source: "breakdown:reviewed" },
      });
    }
    await prisma.eventLog.create({ data: { userId, type: "task.brokendown", data: JSON.stringify({ taskId: id, provider: "reviewed", steps: steps.length }) } });
  }
  revalidatePath("/today");
  revalidatePath("/goals");
  redirect(returnTo);
}
