import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/AppNav";
import { DailyBar } from "@/components/DailyBar";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Plannlyai — Big goals. Small steps. Real progress.",
  description: "Personal execution assistant: goals become daily actions.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let done = 0;
  let total = 0;
  try {
    const userId = await resolveUserId();
    const [d, t] = await Promise.all([
      prisma.task.count({ where: { userId, status: "done" } }),
      prisma.task.count({ where: { userId } }),
    ]);
    done = d;
    total = t;
  } catch {
    // DB offline -> bar shows 0 of 0
  }
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AppNav />
        <div style={{ maxWidth: 1080, margin: "12px auto 0", padding: "0 20px" }}>
          <DailyBar done={done} total={total} />
        </div>
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 80px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
