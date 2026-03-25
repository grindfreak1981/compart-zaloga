"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock: number
  notes?: string
}

const sidebarItems = [
  { icon: "📊", label: "Pregled zaloge", active: true, href: "/pregled-zaloge" },
  { icon: "📥", label: "Prevzem blaga", active: false, href: "/prevzem" },
  { icon: "📤", label: "Poraba", active: false, href: "/poraba" },
  { icon: "📋", label: "Delovni nalogi", active: false, href: "/delniki" },
  { icon: "👥", label: "Stranke", active: false, href: "/stranke" },
  { icon: "🏭", label: "Dobavitelji", active: false, href: "/dobavitelji" },
  { icon: "📈", label: "Poročila", active: false, href: "/porocila" },
]

export default function PregledZaloge() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ name: "", unit: "m²", min_stock: 0, notes: "" })

  const supabase = createClient()

  useEffect(() => { fetchMaterials() }, [])

  const fetchMaterials = async () => {
    const { data, error } = await supabase.from("materials").select("id, name, unit, current_stock, min_stock, notes")
    if (error) console.error("Napaka pri nalaganju:", error)
    else setMaterials(data || [])
    setLoading(false)
  }

  const addMaterial = async () => {
    const { error } = await supabase.from("materials").insert([{
      name: newMaterial.name, unit: newMaterial.unit,
      current_stock: 0, min_stock: parseInt(newMaterial.min_stock.toString()), notes: newMaterial.notes
    }])
    if (!error) {
      fetchMaterials()
      setShowModal(false)
      setNewMaterial({ name: "", unit: "m²", min_stock: 0, notes: "" })
    }
  }

  const deleteMaterial = async (id: number) => {
    await supabase.from("materials").delete().eq("id", id)
    fetchMaterials()
  }

  const getStatus = (stock: number, min: number) => {
    if (stock === 0) return { label: "🔴 Kritično", bg: "#fff5f5", color: "#dc2626" }
    if (stock < min) return { label: "⚠️ Nizko", bg: "#fffbeb", color: "#d97706" }
    return { label: "✅ OK", bg: "transparent", color: "#059669" }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  const nizkaZaloga = materials.filter(m => m.current_stock > 0 && m.current_stock < m.min_stock).length
  const brezZaloge = materials.filter(m => m.current_stock === 0).length

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
        <div style={{ padding: "12px 20px", fontSize: "10px", color: "#4b5563", borderTop: "1px solid #2a2a2a" }}>© 2026 Compart</div>
      </div>

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Pregled zaloge</h1>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Skupen pregled vseh materialov v skladišču.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "13px" }}>Izvozi Excel</button>
            <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", background: "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>+ Dodaj material</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { value: materials.length, label: "Vsi materiali", color: "#c41230" },
            { value: nizkaZaloga, label: "Nizka zaloga ⚠️", color: "#d97706" },
            { value: brezZaloge, label: "Brez zaloge 🔴", color: "#dc2626" },
            { value: "—", label: "Vrednost zaloge", color: "#059669" },
          ].map((card) => (
            <div key={card.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: card.color }}>{card.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Naziv materiala", "Enota", "Zaloga", "Min. zaloga", "Status", "Akcije"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    Še ni dodanih materialov. Klikni <strong>+ Dodaj material</strong>.
                  </td>
                </tr>
              ) : materials.map((material, i) => {
                const status = getStatus(material.current_stock, material.min_stock)
                return (
                  <tr key={material.id} style={{ background: status.bg !== "transparent" ? status.bg : (i % 2 === 0 ? "white" : "#fafafa"), borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>{material.name}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{material.unit}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#111827", fontSize: "13px" }}>{material.current_stock.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{material.min_stock.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", color: status.color, background: `${status.color}22`, border: `1px solid ${status.color}44` }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => deleteMaterial(material.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>🗑️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "480px", borderRadius: "8px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>Nov material</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Naziv materiala *</label>
              <input value={newMaterial.name} onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="Npr. Tiskarski papir A4 80g"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Enota</label>
                <select value={newMaterial.unit} onChange={e => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", background: "white", boxSizing: "border-box" }}>
                  <option value="m²">m²</option>
                  <option value="m">m</option>
                  <option value="kg">kg</option>
                  <option value="kos">kos</option>
                  <option value="l">l</option>
                  <option value="rola">rola</option>
                  <option value="škatla">škatla</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Min. zaloga</label>
                <input type="number" value={newMaterial.min_stock} onChange={e => setNewMaterial({ ...newMaterial, min_stock: parseInt(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Opombe</label>
              <textarea value={newMaterial.notes} onChange={e => setNewMaterial({ ...newMaterial, notes: e.target.value })} rows={3} placeholder="Dobavitelj, cena, opombe..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", border: "1px solid #d1d5db", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Prekliči</button>
              <button onClick={addMaterial} disabled={!newMaterial.name}
                style={{ padding: "10px 20px", background: newMaterial.name ? "#c41230" : "#9ca3af", color: "white", border: "none", borderRadius: "6px", cursor: newMaterial.name ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: "bold" }}>
                Shrani material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
