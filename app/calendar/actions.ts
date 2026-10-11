"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { createFollowUp } from "@/lib/reminders";
import { parseScheduleRequest } from "@/lib/schedule";

const FollowUp = z.object({
  text: z.string().trim().min(2).max(300),
  days: z.coerce.number().min(0).max(365).default(3),
  taskId: z.string().optional(),
});

export async function addFollowUp(formData: FormData) {
  const parsed = FollowUp.safeParse({
    text: formData.get("text"),
    days: formData.get("days") || 3,
    taskId: formData.get("taskId") || undefined,
  });
  if (!parsed.success) return;
  const userId = await resolveUserId();
  await createFollowUp(userId, parsed.data.text, parsed.data.days, parsed.data.taskId || undefined);
  revalidatePath("/calendar");
}

const NewEvent = z.object({
  title: z.string().trim().min(2).max(200),
  date: z.string().trim(),
  time: z.string().trim().default("10:00"),
});

export async function addEvent(formData: FormData) {
  const parsed = NewEvent.safeParse({ title: formData.get("title"), date: formData.get("date"), time: formData.get("time") });
  if (!parsed.success) return;
  const userId = await resolveUserId();
  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time}`);
  if (isNaN(startsAt.getTime())) return;
  await prisma.event.create({ data: { userId, title: parsed.data.title, startsAt, source: "manual" } });
  revalidatePath("/calendar");
  revalidatePath("/today");
}

export async function addEventFromText(formData: FormData) {
  const raw = String(formData.get("text") ?? "").trim().slice(0, 200);
  if (!raw) return;
  const userId = await resolveUserId();
  const { title, baseDate } = parseScheduleRequest(raw);
  // Default: first proposed slot (10:00). Full slot-picker ships with OAuth stretch.
  const startsAt = new Date(baseDate);
  startsAt.setHours(10, 0, 0, 0);
  await prisma.event.create({ data: { userId, title, startsAt, source: "assistant:nl" } });
  revalidatePath("/calendar");
  revalidatePath("/today");
}

export async function dismissReminder(formData: FormData) {
  const id = String(formData.get("id"));
  const userId = await resolveUserId();
  await prisma.reminder.updateMany({ where: { id, userId }, data: { status: "dismissed" } });
  revalidatePath("/calendar");
}
