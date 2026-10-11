"use client";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div style={{ maxWidth: 420, display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 24 }}>Create your account</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
        style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
        style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ chars)" type="password"
        style={{ minHeight: 44, borderRadius: 10, border: "1px solid #E8E4DC", padding: "0 14px" }} />
      {error && <p style={{ color: "#DC2626" }}>{error}</p>}
      <button
        onClick={async () => {
          const res = await signUp.email({ email, password, name });
          if (res.error) setError(res.error.message ?? "Sign-up failed");
          else router.push("/today");
        }}
        style={{ minHeight: 44, borderRadius: 999, background: "#0F766E", color: "#fff", fontWeight: 600 }}
      >
        Sign up
      </button>
    </div>
  );
}
