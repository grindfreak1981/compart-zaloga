"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import Sidebar from "@/components/Sidebar"
import * as XLSX from "xlsx"

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock: number
  notes?: string
}

export default function PregledZaloge() {
  const { profile, loading: profileLoading } = useProfile()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | null>(null)
  const [form, setForm] = useState({ name: "", unit: "m²", current_stock: 0, min_stock: 0, notes: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()
  const canEdit = hasPermission(profile, PERMISSIONS.EDIT_STOCK)

  useEffect(() => { fetchMaterials() }, [])

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("id, name, unit, current_stock, min_stock, notes")
    setMaterials(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditMaterial(null)
    setForm({ name: "", unit: "m²", current_stock: 0, min_stock: 0, notes: "" })
    setError("")
    setShowModal(true)
  }

  const openEdit = (m: Material) => {
    setEditMaterial(m)
    setForm({ name: m.name, unit: m.unit, current_stock: m.current_stock, min_stock: m.min_stock, notes: m.notes || "" })
    setError("")
    setShowModal(true)
  }

  const handleSave = async () => {
    setError("")
    if (!form.name.trim()) { setError("Vpiši naziv materiala."); return }
    setSaving(true)
    if (editMaterial) {
      const { error: e } = await supabase.from("materials").update({ name: form.name.trim(), unit: form.unit, current_stock: parseFloat(form.current_stock.toString()) || 0, min_stock: parseInt(form.min_stock.toString()) || 0, notes: form.notes }).eq("id", editMaterial.id)
      if (e) { setError("Napaka: " + e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from("materials").insert([{ name: form.name.trim(), unit: form.unit, current_stock: parseFloat(form.current_stock.toString()) || 0, min_stock: parseInt(form.min_stock.toString()) || 0, notes: form.notes }])
      if (e) { setError("Napaka: " + e.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchMaterials()
  }

  const deleteMaterial = async (id: number) => {
    if (!confirm("Res želiš izbrisati ta material?")) return
    await supabase.from("materials").delete().eq("id", id)
    fetchMaterials()
  }

  const exportExcel = () => {
    const data = materials.map(m => ({
      "Naziv materiala": m.name, "Enota": m.unit, "Trenutna zaloga": m.current_stock,
      "Min. zaloga": m.min_stock,
      "Status": m.current_stock === 0 ? "Kritično" : m.current_stock < m.min_stock ? "Nizko" : "OK",
      "Opombe": m.notes || "",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Zaloga")
    XLSX.writeFile(wb, `zaloga-${new Date().toLocaleDateString("sl-SI").replace(/\./g, "-")}.xlsx`)
  }

  const getStatus = (stock: number, min: number) => {
    if (stock === 0) return { label: "🔴 Kritično", bg: "#fff5f5", color: "#dc2626" }
    if (stock < min) return { label: "⚠️ Nizko", bg: "#fffbeb", color: "#d97706" }
    return { label: "✅ OK", bg: "transparent", color: "#059669" }
  }

  if (loading || profileLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  const nizkaZaloga = materials.filter(m => m.current_stock > 0 && m.current_stock < m.min_stock).length
  const brezZaloge = materials.filter(m => m.current_stock === 0).length

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar active="/pregled-zaloge" profile={profile} />

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Pregled zaloge</h1>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Skupen pregled vseh materialov v skladišču.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={exportExcel} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "13px" }}>📥 Izvozi Excel</button>
            {canEdit && (
              <button onClick={openAdd} style={{ padding: "8px 16px", background: "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>+ Dodaj material</button>
            )}
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
                {["Naziv materiala", "Enota", "Zaloga", "Min. zaloga", "Status", ...(canEdit ? ["Akcije"] : [])].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    Še ni dodanih materialov.
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
                    {canEdit && (
                      <td style={{ padding: "12px 16px", display: "flex", gap: "8px" }}>
                        <button onClick={() => openEdit(material)} style={{ padding: "5px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>✏️ Uredi</button>
                        <button onClick={() => deleteMaterial(material.id)} style={{ padding: "5px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🗑️ Izbriši</button>
                      </td>
                    )}
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
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>{editMaterial ? "Uredi material" : "Nov material"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            {error && <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>⚠️ {error}</div>}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Naziv materiala *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Npr. Tiskarski papir A4 80g"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Enota</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", background: "white", boxSizing: "border-box" }}>
                {["m²", "m", "kg", "kos", "l", "rola", "škatla"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Trenutna zaloga</label>
                <input type="number" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Min. zaloga</label>
                <input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Opombe</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", border: "1px solid #d1d5db", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Prekliči</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "10px 20px", background: saving ? "#9ca3af" : "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "bold" }}>
                {saving ? "Shranjujem..." : "Shrani"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
