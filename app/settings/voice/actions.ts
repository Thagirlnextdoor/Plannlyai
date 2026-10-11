"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveUserId } from "@/lib/session";
import { saveVoice } from "@/lib/email";

const Voice = z.object({
  tone: z.string().max(120).optional(),
  formality: z.string().max(60).optional(),
  greeting: z.string().max(60).optional(),
  signoff: z.string().max(120).optional(),
  samples: z.string().max(4000).optional(),
});

export async function updateVoice(formData: FormData) {
  const parsed = Voice.safeParse({
    tone: formData.get("tone") || undefined,
    formality: formData.get("formality") || undefined,
    greeting: formData.get("greeting") || undefined,
    signoff: formData.get("signoff") || undefined,
    samples: formData.get("samples") || undefined,
  });
  if (!parsed.success) return;
  await saveVoice(await resolveUserId(), parsed.data);
  revalidatePath("/settings/voice");
  revalidatePath("/automations");
}
