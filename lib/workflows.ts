import { prisma } from "./db";
import { generatePlan } from "./ai";
import { persistPlan } from "./plan";

const KNOWN_ROUTINES: { match: RegExp; name: string; steps: string[] }[] = [
  {
    match: /monday|weekly reset|weekly review|plan.*week/i,
    name: "Monday Weekly Reset",
    steps: [
      "Review previous week's goals",
      "Identify unfinished tasks",
      "Review upcoming appointments",
      "Review important emails",
      "Identify weekly priorities",
      "Schedule important activities",
      "Select daily actions",
    ],
  },
  {
    match: /morning|start.*day|daily reset/i,
    name: "Morning Startup",
    steps: ["Check today's focus", "Pick one priority", "Clear one quick win", "Review the calendar"],
  },
  {
    match: /evening|shutdown|end.*day|wrap.*day/i,
    name: "Evening Shutdown",
    steps: ["Mark what got done", "Move unfinished items to tomorrow's list", "Note tomorrow's #1 priority", "Close the laptop"],
  },
  {
    match: /monthly review|month.*review/i,
    name: "Monthly Review",
    steps: ["Review goal progress", "Celebrate one win", "Drop or reschedule stale tasks", "Set next month's outcome"],
  },
];

// Plain language -> structured routine. Known rituals matched first,
// otherwise split the description into steps.
export function parseWorkflowRequest(text: string): { name: string; steps: string[] } {
  for (const r of KNOWN_ROUTINES) {
    if (r.match.test(text)) return { name: r.name, steps: r.steps };
  }
  const steps = text
    .split(/[,;\n]| then | and then /i)
    .map((s) => s.replace(/^(i need to|i want to|every \w+|please)\s+/i, "").trim().replace(/\s+/g, " "))
    .filter((s) => s.length > 2)
    .slice(0, 10);
  const name = steps[0] ? `Routine: ${steps[0].slice(0, 40)}` : "Custom routine";
  return { name, steps: steps.length ? steps : ["Check today's focus"] };
}

export async function createWorkflow(userId: string, name: string, steps: string[], schedule?: string) {
  return prisma.workflow.create({ data: { userId, name, steps: JSON.stringify(steps), schedule } });
}

// Running a workflow materializes each step as a real task (source-tagged),
// so runs are visible in Today and progress counts them.
export async function runWorkflow(userId: string, workflowId: string) {
  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf) throw new Error("workflow not found");
  const steps = JSON.parse(wf.steps) as string[];
  const run = await prisma.workflowRun.create({ data: { workflowId, result: `materialized ${steps.length} tasks` } });
  let order = 0;
  for (const s of steps) {
    await prisma.task.create({
      data: { userId, title: s, type: "routine", estimateMin: 15, order: order++, source: `workflow:${wf.name}` },
    });
  }
  await prisma.eventLog.create({ data: { userId, type: "workflow.ran", data: JSON.stringify({ workflowId, runId: run.id }) } });
  return { run, count: steps.length };
}

export const GOAL_TEMPLATES: Record<string, { label: string; title: string; outcome: string; hours: number }> = {
  fitness: { label: "Fitness", title: "Build a consistent exercise routine", outcome: "Exercise 3x per week for a month", hours: 3 },
  business: { label: "Business", title: "Launch my small business this year", outcome: "First paying customers", hours: 5 },
  finance: { label: "Money", title: "Save my emergency fund", outcome: "3 months of expenses saved", hours: 2 },
  cert: { label: "Certification", title: "Earn my professional certification", outcome: "Pass the exam", hours: 6 },
};

export async function createGoalFromTemplate(userId: string, key: string) {
  const t = GOAL_TEMPLATES[key];
  if (!t) throw new Error("unknown template");
  const goal = await prisma.goal.create({ data: { userId, title: t.title, outcome: t.outcome } });
  const { nodes } = await generatePlan({ goalTitle: t.title, hoursPerWeek: t.hours });
  await persistPlan(userId, goal.id, nodes);
  await prisma.eventLog.create({ data: { userId, type: "goal.from-template", data: JSON.stringify({ goalId: goal.id, template: key }) } });
  return goal;
}
