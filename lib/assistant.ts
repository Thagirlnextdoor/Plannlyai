import { prisma } from "./db";
import { simplifyTask } from "./ai";
import { listToday } from "./today";
import { createWorkflow, parseWorkflowRequest } from "./workflows";

// Calm, non-judgmental tone guard: never guilt, always next-action.
const TONE = "Let's figure out what's next.";

export interface AssistResult {
  reply: string;
  actions: string[];
}

async function openTasks(userId: string) {
  return prisma.task.findMany({ where: { userId, status: { in: ["todo", "doing"] } }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], take: 20 });
}

async function goalName(goalId: string | null): Promise<string> {
  if (!goalId) return "your list";
  const g = await prisma.goal.findUnique({ where: { id: goalId } });
  return g ? `“${g.title}”` : "your list";
}

export async function interpret(userId: string, raw: string): Promise<AssistResult> {
  const input = raw.toLowerCase();
  const tasks = await openTasks(userId);
  const first = tasks[0];

  // ROUTINE — "every monday I need to..." -> save a reusable workflow
  if (/^\/routine\b|routine|workflow|\breset\b|every (monday|tuesday|wednesday|thursday|friday|morning|evening|week|month|day)/.test(input)) {
    const { name, steps } = parseWorkflowRequest(raw);
    await createWorkflow(userId, name, steps, "manual");
    const lines = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    return { reply: `Saved “${name}” as a reusable routine:\n${lines}\n\nRun it any time from Automations — each run drops the steps into Today as real tasks.`, actions: [`workflow:created:${name}`] };
  }

  // EMAIL — point to the composer (drafting itself lives in Automations)
  if (/^\/email\b|draft.*email|write.*email|email.*draft/.test(input)) {
    return { reply: "I can set that up in the composer — it drafts in your voice and shows which template it used. Open Automations → Email composer, or set your voice first under Settings → Your voice. Nothing sends without your tap.", actions: [] };
  }

  // WHY — explain context of current focus
  if (/^\/why\b|why is this|why.+on my list/.test(input)) {
    if (!first) return { reply: "Your list is clear. Nothing needs explaining. 🌱", actions: [] };
    return { reply: `“${first.title}” is on your list because it moves ${await goalName(first.goalId)} forward. Next tiny step after it: tell me and I'll break it down further.`, actions: [] };
  }

  // SMALLER / overwhelmed — break down the current focus
  if (/^\/smaller\b|break .*down|overwhelm|too much|too big/.test(input)) {
    if (!first) return { reply: "Nothing open to shrink — your plate is clear.", actions: [] };
    const { steps } = await simplifyTask(first.title, userId);
    let order = 0;
    for (const s of steps.slice(0, 5)) {
      await prisma.task.create({ data: { userId, goalId: first.goalId, parentId: first.id, title: s, type: "tiny", estimateMin: 5, order: order++, source: "assistant:smaller" } });
    }
    return { reply: `${TONE} I split “${first.title}” into ${steps.length} smaller steps. Start with just the first one for 5 minutes — that's enough.`, actions: [`split:${first.id}`] };
  }

  // REPLAN — fit today into a time budget ("only 20 min", "rework today")
  if (/^\/replan\b|only \d+|rework|no time|can't do this today/.test(input)) {
    const m = input.match(/(\d+)\s*min/);
    const budget = m ? parseInt(m[1], 10) : 30;
    let used = 0;
    const keep: string[] = [];
    for (const t of tasks) {
      const est = t.estimateMin ?? 25;
      if (used + est <= budget && keep.length < 3) { used += est; keep.push(t.id); }
    }
    // Re-order: kept tasks first (order 0..), rest keep their place but after.
    let order = 0;
    for (const id of keep) { await prisma.task.update({ where: { id }, data: { order: order++ } }); }
    for (const t of tasks.filter((t) => !keep.includes(t.id))) { await prisma.task.update({ where: { id: t.id }, data: { order: order++ } }); }
    if (!keep.length) return { reply: `${TONE} even ${budget} minutes is tight. One option: a single 5-minute tiny step — want me to shrink your top task?`, actions: [] };
    const names = tasks.filter((t) => keep.includes(t.id)).map((t) => `• ${t.title}`).join("\n");
    return { reply: `${TONE} reworked today to fit ~${budget} min (about ${used} min planned):\n${names}\nEverything else stays on the list — nothing deleted, nothing failed.`, actions: ["replan:today"] };
  }

  // RECOVER — fell behind: surface the single next action, keep momentum
  if (/^\/recover\b|fell behind|behind|restart|missed/.test(input)) {
    if (!first) return { reply: "Nothing overdue — you're actually caught up. Nice.", actions: [] };
    await prisma.task.update({ where: { id: first.id }, data: { order: 0 } });
    return { reply: `${TONE} No guilt, no backlog lecture. Your next manageable action is: “${first.title}”. Do just that one — I'll keep the rest warm for later.`, actions: [`recover:${first.id}`] };
  }

  // TODAY / default — focus summary
  const today = await listToday(userId);
  if (/^\/today\b|focus|what should i|first\b/.test(input) || true) {
    if (!today.priorities.length) return { reply: "Today is clear. If you like, tell me a goal and I'll draft your next small steps.", actions: [] };
    const lines = today.priorities.map((t, i) => `${i + 1}. ${t.title}${t.goalTitle ? ` (for ${t.goalTitle})` : ""}`).join("\n");
    return { reply: `Here's what matters today:\n${lines}\n\nStart with #1 — reply "smaller" any time and I'll shrink it.`, actions: [] };
  }
}

export async function chat(userId: string, body: string) {
  let thread = await prisma.assistantThread.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!thread) thread = await prisma.assistantThread.create({ data: { userId } });
  await prisma.message.create({ data: { threadId: thread.id, role: "user", body } });
  const result = await interpret(userId, body);
  await prisma.message.create({ data: { threadId: thread.id, role: "assistant", body: result.reply, planDiff: JSON.stringify(result.actions) } });
  await prisma.eventLog.create({ data: { userId, type: "assistant.chat", data: JSON.stringify({ actions: result.actions }) } });
  return { threadId: thread.id, ...result };
}
