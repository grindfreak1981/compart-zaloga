"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { useIsMobile } from "@/hooks/useIsMobile"
import Sidebar from "@/components/Sidebar"

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
}

export default function Prevzem() {
  const { profile, loading: profileLoading } = useProfile()
  const isMobile = useIsMobile()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(0)
  const [note, setNote] = useState("")
  const [success, setSuccess] = useState(false)
  const [movements, setMovements] = useState<any[]>([])

  const supabase = createClient()
  const canStockIn = hasPermission(profile, PERMISSIONS.STOCK_IN)

  useEffect(() => { fetchMaterials(); fetchMovements() }, [])

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("id, name, unit, current_stock").order("name")
    setMaterials(data || [])
    setLoading(false)
  }

  const fetchMovements = async () => {
    const { data } = await supabase.from("stock_movements").select("*").eq("type", "in").order("created_at", { ascending: false }).limit(10)
    setMovements(data || [])
  }

  const handlePrevzem = async () => {
    if (!selectedMaterial || quantity <= 0) return
    await supabase.from("stock_movements").insert([{ material_id: selectedMaterial, type: "in", quantity, note }])
    const material = materials.find(m => m.id === selectedMaterial)
    if (material) await supabase.from("materials").update({ current_stock: material.current_stock + quantity }).eq("id", selectedMaterial)
    setSuccess(true)
    setSelectedMaterial(null)
    setQuantity(0)
    setNote("")
    fetchMaterials()
    fetchMovements()
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading || profileLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar active="/prevzem" profile={profile} />

      <div style={{ flex: 1, background: "#f8fafc", padding: isMobile ? "16px" : "32px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Prevzem blaga</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "4px 0 0 0" }}>Dodaj novo zalogo materiala v skladišče.</p>
        </div>

        {!canStockIn ? (
          <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "8px", padding: "24px", color: "#dc2626", fontSize: "14px" }}>
            🔒 Nimaš dovoljenja za prevzem blaga.
          </div>
        ) : (
          <>
            {success && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "14px 18px", marginBottom: "24px", color: "#16a34a", fontWeight: "500", fontSize: "14px" }}>
                ✅ Prevzem uspešno shranjen!
              </div>
            )}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", maxWidth: "560px" }}>
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
          </>
        )}

        <div style={{ marginTop: "40px", maxWidth: "560px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>Zadnji prevzemi</h2>
          {movements.length === 0 ? <p style={{ color: "#9ca3af", fontSize: "14px" }}>Še ni zapisov.</p> : (
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                      {["Material", "Količina", "Opomba", "Datum"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m, i) => {
                      const mat = materials.find(x => x.id === m.material_id)
                      return (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={{ padding: "10px 14px", fontSize: "13px", color: "#111827" }}>{mat?.name || "—"}</td>
                          <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "600", color: "#059669", whiteSpace: "nowrap" }}>+{m.quantity} {mat?.unit}</td>
                          <td style={{ padding: "10px 14px", fontSize: "13px", color: "#6b7280" }}>{m.note || "—"}</td>
                          <td style={{ padding: "10px 14px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>{new Date(m.created_at).toLocaleDateString("sl-SI")}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}