"use client";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";

const LINKS = [
  ["Today", "/today"],
  ["Dashboard", "/dashboard"],
  ["Goals", "/goals"],
  ["Tasks", "/tasks"],
  ["Calendar", "/calendar"],
  ["Automations", "/automations"],
  ["Assistant", "/assistant"],
  ["Design", "/design"],
] as const;

export function AppNav() {
  const { data: session, isPending } = useSession();
  return (
    <header style={{ borderBottom: "1px solid #E8E4DC", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/today" style={{ fontWeight: 800, color: "#0F766E", textDecoration: "none" }}>Plannlyai</Link>
        {LINKS.map(([label, href]) => (
          <Link key={href} href={href} style={{ fontSize: 14, color: "#1E1E1E", textDecoration: "none" }}>
            {label}
          </Link>
        ))}
        <span style={{ flex: 1 }} />
        {isPending ? (
          <span style={{ fontSize: 13, color: "#6B6B6B" }}>…</span>
        ) : session?.user ? (
          <>
            <span style={{ fontSize: 13, color: "#6B6B6B" }}>{session.user.email}</span>
            <button onClick={() => signOut()} style={{ fontSize: 13 }}>Sign out</button>
          </>
        ) : (
          <>
            <Link href="/sign-in" style={{ fontSize: 13 }}>Sign in</Link>
            <Link href="/sign-up" style={{ fontSize: 13 }}>Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
