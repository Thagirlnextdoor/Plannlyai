// Self-hosted reminder worker: `npm run worker` or OS Task Scheduler hitting
// POST /api/reminders/run with { "secret": CRON_SECRET }. Free, on-device.
import { prisma } from "../lib/db";
import { runDueReminders, nudgeText } from "../lib/reminders";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  let total = 0;
  for (const u of users) {
    const nudges = await runDueReminders(u.id);
    for (const n of nudges) console.log(`[worker] ${u.id}: ${nudgeText(n)}`);
    total += nudges.length;
  }
  console.log(`[worker] done, ${total} nudges across ${users.length} users`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
