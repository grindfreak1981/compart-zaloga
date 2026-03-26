"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
}

const sidebarItems = [
  { icon: "🏠", label: "Dashboard", active: false, href: "/" },
  { icon: "📊", label: "Pregled zaloge", active: false, href: "/pregled-zaloge" },
  { icon: "📥", label: "Prevzem blaga", active: true, href: "/prevzem" },
  { icon: "📤", label: "Poraba", active: false, href: "/poraba" },
  { icon: "📋", label: "Delovni nalogi", active: false, href: "/delniki" },
  { icon: "👥", label: "Stranke", active: false, href: "/stranke" },
  { icon: "🏭", label: "Dobavitelji", active: false, href: "/dobavitelji" },
  { icon: "📈", label: "Poročila", active: false, href: "/porocila" },
]

export default function Prevzem() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(0)
  const [note, setNote] = useState("")
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => { fetchMaterials() }, [])

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("id, name, unit, current_stock").order("name")
    setMaterials(data || [])
    setLoading(false)
  }

  const handlePrevzem = async () => {
    if (!selectedMaterial || quantity <= 0) return
    const { error: movementError } = await supabase.from("stock_movements").insert([{ material_id: selectedMaterial, type: "in", quantity, note }])
    if (movementError) return
    const material = materials.find(m => m.id === selectedMaterial)
    if (!material) return
    await supabase.from("materials").update({ current_stock: material.current_stock + quantity }).eq("id", selectedMaterial)
    setSuccess(true)
    setSelectedMaterial(null)
    setQuantity(0)
    setNote("")
    fetchMaterials()
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ width: "240px", minWidth: "240px", background: "#1c1c1c", color: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#c41230", padding: "16px 20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>🖨️ Tiskarna</div>
          <div style={{ fontSize: "11px", color: "#ffcdd2" }}>Zaloga materialov</div>
        </div>
        <div style={{ padding: "16px 12px", flex: 1 }}>
          {sidebarItems.map((item) => (
            <a key={item.label} href={item.href} style={{
              display: "block", padding: "10px 14px", borderRadius: "6px", marginBottom: "4px",
              background: item.active ? "rgba(196,18,48,0.25)" : "transparent",
              borderLeft: item.active ? "3px solid #c41230" : "3px solid transparent",
              color: item.active ? "white" : "#9ca3af",
              cursor: "pointer", fontSize: "13px", textDecoration: "none",
            }}>
              {item.icon}&nbsp;&nbsp;{item.label}
            </a>
          ))}
        </div>
        <div style={{ padding: "12px", borderTop: "1px solid #2a2a2a" }}>
          <button onClick={handleLogout} style={{
            display: "block", width: "100%", padding: "10px 14px", borderRadius: "6px",
            background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: "13px",
            textAlign: "left", border: "none", marginBottom: "8px"
          }}>
            🚪&nbsp;&nbsp;Odjava
          </button>
          <div style={{ fontSize: "10px", color: "#4b5563", paddingLeft: "4px" }}>© 2026 Compart</div>
        </div>
      </div>

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Prevzem blaga</h1>
          <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Dodaj novo zalogo materiala v skladišče.</p>
        </div>

        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "14px 18px", marginBottom: "24px", color: "#16a34a", fontWeight: "500", fontSize: "14px" }}>
            ✅ Prevzem uspešno shranjen!
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "28px", maxWidth: "560px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Material *</label>
            <select value={selectedMaterial || ""} onChange={e => setSelectedMaterial(parseInt(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", background: "white", boxSizing: "border-box" }}>
              <option value="">-- Izberi material --</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name} (trenutno: {m.current_stock} {m.unit})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Količina *</label>
            <input type="number" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} min={0}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Opomba</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Dobavitelj, številka dobavnice..."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <button onClick={handlePrevzem} disabled={!selectedMaterial || quantity <= 0}
            style={{ width: "100%", padding: "12px", background: selectedMaterial && quantity > 0 ? "#c41230" : "#9ca3af", color: "white", border: "none", borderRadius: "6px", cursor: selectedMaterial && quantity > 0 ? "pointer" : "not-allowed", fontSize: "15px", fontWeight: "bold" }}>
            📥 Potrdi prevzem
          </button>
        </div>

        <div style={{ marginTop: "40px", maxWidth: "560px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>Zadnji prevzemi</h2>
          <RecentMovements type="in" supabase={supabase} materials={materials} />
        </div>
      </div>
    </div>
  )
}

function RecentMovements({ type, supabase, materials }: { type: string, supabase: any, materials: Material[] }) {
  const [movements, setMovements] = useState<any[]>([])
  useEffect(() => {
    supabase.from("stock_movements").select("*").eq("type", type).order("created_at", { ascending: false }).limit(10)
      .then(({ data }: any) => setMovements(data || []))
  }, [])
  if (movements.length === 0) return <p style={{ color: "#9ca3af", fontSize: "14px" }}>Še ni zapisov.</p>
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {["Material", "Količina", "Opomba", "Datum"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movements.map((m, i) => {
            const mat = materials.find(x => x.id === m.material_id)
            return (
              <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ padding: "10px 14px", fontSize: "13px", color: "#111827" }}>{mat?.name || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "600", color: "#059669" }}>+{m.quantity} {mat?.unit}</td>
                <td style={{ padding: "10px 14px", fontSize: "13px", color: "#6b7280" }}>{m.note || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: "13px", color: "#6b7280" }}>{new Date(m.created_at).toLocaleDateString("sl-SI")}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
