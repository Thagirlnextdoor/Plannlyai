"use server";
import { revalidatePath } from "next/cache";
import { resolveUserId } from "@/lib/session";
import { chat } from "@/lib/assistant";

export async function sendMessage(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!body) return;
  await chat(await resolveUserId(), body);
  revalidatePath("/assistant");
}
