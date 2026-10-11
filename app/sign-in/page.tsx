"use client";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div style={{ maxWidth: 420, display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 24 }}>Sign in</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
        style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password"
        style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
      {error && <p style={{ color: "#DC2626" }}>{error}</p>}
      <button
        onClick={async () => {
          const res = await signIn.email({ email, password });
          if (res.error) setError(res.error.message ?? "Sign-in failed");
          else router.push("/today");
        }}
        style={{ minHeight: 44, borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}
      >
        Sign in
      </button>
    </div>
  );
}
