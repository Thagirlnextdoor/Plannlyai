import { prisma } from "../lib/db";

async function main() {
  const email = "demo@plannlyai.local";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo User" },
  });
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Launch coaching business by December",
      outcome: "First paying clients + bookable offer",
    },
  });
  const milestone = await prisma.milestone.create({
    data: { goalId: goal.id, title: "Define offer + audience", order: 0 },
  });
  const monthly = await prisma.monthlyOutcome.create({
    data: { milestoneId: milestone.id, title: "September: offer + audience defined", month: "2026-09" },
  });
  await prisma.weeklyObjective.create({
    data: { monthlyId: monthly.id, title: "Week 1: define ideal client" },
  });
  await prisma.task.createMany({
    data: [
      { userId: user.id, goalId: goal.id, title: "Write down 3 types of people to help", type: "daily", order: 0 },
      { userId: user.id, goalId: goal.id, title: "Put on workout clothes", type: "quick-win", order: 1 },
    ],
  });
  console.log(`Seeded demo user ${email} + goal ${goal.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
