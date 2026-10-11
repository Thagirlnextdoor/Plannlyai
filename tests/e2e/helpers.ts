import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Minimal .env loader (no deps): KEY=VALUE lines, skips blanks/comments.
function loadEnv() {
  const p = path.join(process.cwd(), ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

export const prisma = new PrismaClient();

export async function cleanupE2E() {
  await prisma.task.deleteMany({ where: { title: { startsWith: "E2E" } } });
  await prisma.reminder.deleteMany({ where: { context: { startsWith: "E2E" } } });
  await prisma.goal.deleteMany({ where: { title: { startsWith: "E2E" } } });
  await prisma.event.deleteMany({ where: { title: { startsWith: "E2E" } } });
}
