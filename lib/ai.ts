// Free-only AI layer ($0 default). offline templates -> ollama local -> cloud free-tiers.
// Never throws: always falls back to deterministic offline output.
import { aiRateLimit } from "./ratelimit";
export type PlanNodeType = "milestone" | "monthly" | "weekly" | "daily" | "tiny";

export interface PlanNode {
  title: string;
  type: PlanNodeType;
  estimateMin?: number;
  dueAt?: Date;
  children?: PlanNode[];
}

export interface BreakdownInput {
  goalTitle: string;
  targetDate?: string;
  hoursPerWeek?: number;
  context?: string;
}

const PROVIDER = process.env.AI_PROVIDER ?? "offline";
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

const short = (s: string) => s.trim().replace(/\s+/g, " ");

// Concrete commitments hidden in free text, e.g.
// "save ₦3,500 every 3 days" / "save N10,000 every week".
export interface Commitment {
  amount: string;
  everyDays: number;
  label: string;
}

export function parseCommitments(text: string): Commitment[] {
  const out: Commitment[] = [];
  const safe = text.replace(/(\d),(\d)/g, "$1$2"); // keep 10,000 together
  const clauses = safe.split(/[,.;\n]| and then | then | and (?=save|pay|set)/i);
  for (const clause of clauses) {
    const amt = clause.match(/₦\s*([\d,]+)|\bN\s?(\d[\d,]*)/);
    if (!amt) continue;
    const amount = "₦" + (amt[1] ?? amt[2]).replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const c = clause.toLowerCase();
    let everyDays = 7;
    let label = "weekly";
    const everyN = c.match(/every\s+(\d+)\s*days?/);
    if (everyN) {
      everyDays = parseInt(everyN[1], 10);
      label = `every ${everyDays} days`;
    } else if (/daily|every ?day/.test(c)) {
      everyDays = 1;
      label = "daily";
    } else if (/month/.test(c)) {
      everyDays = 30;
      label = "monthly";
    } else if (/week/.test(c)) {
      everyDays = 7;
      label = "weekly";
    }
    out.push({ amount, everyDays, label });
  }
  return out.slice(0, 4);
}

function savingsPlan(goal: string, commitments: Commitment[]): PlanNode[] {
  const days: PlanNode[] = [];
  for (const c of commitments) {
    const occurrences = c.everyDays <= 1 ? 7 : c.everyDays <= 7 ? 4 : 3;
    for (let i = 1; i <= occurrences; i++) {
      const due = new Date();
      due.setDate(due.getDate() + c.everyDays * i);
      days.push({
        title: `Save ${c.amount} (${c.label} — ${i} of ${occurrences}, due ${due.toLocaleDateString()})`,
        type: "daily",
        estimateMin: 10,
        dueAt: due,
        children: [{ title: `Confirm ${c.amount} set aside`, type: "tiny", estimateMin: 5 }],
      });
    }
  }
  return [
    {
      title: `Get clear on: ${goal}`, type: "milestone",
      children: [{ title: "Month 1: set the target", type: "monthly", children: [
        { title: "Week 1: write down the exact target amount and date", type: "weekly", children: [
          { title: "Write the target where you'll see it daily", type: "daily", estimateMin: 10, children: [
            { title: "Open your notes and write one line", type: "tiny", estimateMin: 5 }] }] }] }],
    },
    {
      title: `Save consistently toward: ${goal}`, type: "milestone",
      children: [{ title: "This month: scheduled savings", type: "monthly", children: [
        { title: "This week: stay on schedule", type: "weekly", children: days }] }],
    },
    {
      title: `Finish strong: ${goal}`, type: "milestone",
      children: [{ title: "Final stretch: complete + celebrate", type: "monthly", children: [
        { title: "This week: wrap the next piece", type: "weekly", children: [
          { title: "Review what you've saved so far", type: "daily", estimateMin: 15, children: [
            { title: "Check your balance and note it down", type: "tiny", estimateMin: 5 }] }] }] }],
    },
  ];
}

export function offlinePlan(input: BreakdownInput): PlanNode[] {
  const goal = short(input.goalTitle);
  const commitments = parseCommitments(`${input.goalTitle}. ${input.context ?? ""}`);
  if (commitments.length) return savingsPlan(goal, commitments);
  const tiny = (title: string): PlanNode => ({ title, type: "tiny", estimateMin: 5 });
  const daily = (title: string, kids: PlanNode[]): PlanNode => ({ title, type: "daily", estimateMin: 25, children: kids });
  const weekly = (title: string, kids: PlanNode[]): PlanNode => ({ title, type: "weekly", children: kids });
  const monthly = (title: string, kids: PlanNode[]): PlanNode => ({ title, type: "monthly", children: kids });
  return [
    {
      title: `Get clear on: ${goal}`, type: "milestone",
      children: [monthly("Month 1: foundations", [
        weekly("Week 1: define success", [
          daily("Spend 25 min defining what success looks like", [
            tiny("Open your notes and write one sentence about the outcome"),
          ]),
        ]),
      ])],
    },
    {
      title: `Build momentum on: ${goal}`, type: "milestone",
      children: [monthly("Month 2: steady action", [
        weekly("This week: three small sessions", [
          daily("Do one 25-min focused session", [tiny("Start a 5-minute timer and begin")]),
        ]),
      ])],
    },
    {
      title: `Finish strong: ${goal}`, type: "milestone",
      children: [monthly("Final month: complete + review", [
        weekly("This week: wrap the next piece", [
          daily("Complete one concrete piece today", [tiny("Name the one piece on paper")]),
        ]),
      ])],
    },
  ];
}

export function offlineSplit(title: string): string[] {
  const t = short(title);
  return [
    `Define what "done" means for: ${t}`,
    `Gather what you need for: ${t}`,
    `Do the smallest part of: ${t} (5 min)`,
    `Review and finish: ${t}`,
  ];
}

async function ollamaChat(system: string, user: string): Promise<string> {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const json = (await res.json()) as { message?: { content?: string } };
  return json.message?.content ?? "";
}

function asPlanNodes(raw: unknown): PlanNode[] | null {
  if (!Array.isArray(raw)) return null;
  const clean = (n: unknown): PlanNode | null => {
    if (typeof n !== "object" || n === null) return null;
    const o = n as Record<string, unknown>;
    if (typeof o.title !== "string" || !o.title.trim()) return null;
    const type = (o.type as PlanNodeType) ?? "daily";
    const kids = Array.isArray(o.children) ? o.children.map(clean).filter((x): x is PlanNode => x !== null) : undefined;
    const due = typeof o.dueAt === "string" && !isNaN(Date.parse(o.dueAt)) ? new Date(o.dueAt) : undefined;
    return { title: short(o.title).slice(0, 200), type, estimateMin: typeof o.estimateMin === "number" ? o.estimateMin : undefined, dueAt: due, children: kids?.length ? kids : undefined };
  };
  const nodes = raw.map(clean).filter((x): x is PlanNode => x !== null);
  return nodes.length ? nodes : null;
}

async function ollamaPlan(input: BreakdownInput): Promise<PlanNode[]> {
  const system = `You break personal goals into small actionable plans. Reply ONLY with JSON: an array of 2-4 milestones. Each node: {"title": string, "type": "milestone|monthly|weekly|daily|tiny", "estimateMin"?: number, "children"?: [...]}. Depth: milestone > monthly > weekly > daily > tiny. Keep titles short and concrete.`;
  const user = `Goal: ${input.goalTitle}${input.targetDate ? ` | Target: ${input.targetDate}` : ""}${input.hoursPerWeek ? ` | Hours/week: ${input.hoursPerWeek}` : ""}${input.context ? ` | Context: ${input.context}` : ""}`;
  const content = await ollamaChat(system, user);
  const parsed = asPlanNodes(JSON.parse(content));
  if (!parsed) throw new Error("ollama bad shape");
  return parsed;
}

async function ollamaSplit(title: string): Promise<string[] | null> {
  try {
    const content = await ollamaChat(
      `You split tasks into smaller steps. Reply ONLY with a JSON array of 2-5 short step strings, smallest first.`,
      `Task: ${title}`
    );
    const parsed: unknown = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) return parsed.map((s) => short(s).slice(0, 200));
    return null;
  } catch {
    return null;
  }
}

export async function generatePlan(input: BreakdownInput, budgetKey?: string): Promise<{ nodes: PlanNode[]; provider: string }> {
  if (PROVIDER === "ollama") {
    if (budgetKey && !aiRateLimit(`plan:${budgetKey}`)) return { nodes: offlinePlan(input), provider: "offline-rate-limited" };
    try {
      return { nodes: await ollamaPlan(input), provider: "ollama" };
    } catch {
      return { nodes: offlinePlan(input), provider: "offline-fallback" };
    }
  }
  return { nodes: offlinePlan(input), provider: "offline" };
}

export async function simplifyTask(title: string, budgetKey?: string): Promise<{ steps: string[]; provider: string }> {
  if (PROVIDER === "ollama") {
    if (!budgetKey || aiRateLimit(`split:${budgetKey}`)) {
      const steps = await ollamaSplit(title);
      if (steps) return { steps, provider: "ollama" };
    }
    return { steps: offlineSplit(title), provider: budgetKey ? "offline-rate-limited" : "offline-fallback" };
  }
  return { steps: offlineSplit(title), provider: "offline" };
}
