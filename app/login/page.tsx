"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const email = `${username.trim().toLowerCase()}@compart.local`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Napačno uporabniško ime ali geslo.")
      setLoading(false)
      return
    }
    router.push("/")
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "40px", width: "380px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🖨️</div>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#111827", margin: 0 }}>Tiskarna</h1>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "6px 0 0 0" }}>Sistem za upravljanje zaloge</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>
              ⚠️ {error}
            </div>
          )}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Uporabniško ime</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="npr. janez"
              required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Geslo</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: loading ? "#9ca3af" : "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: "bold" }}>
            {loading ? "Prijavljam..." : "Prijava"}
          </button>
        </form>
      </div>
    </div>
  )
}
