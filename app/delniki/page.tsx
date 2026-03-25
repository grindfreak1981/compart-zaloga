"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
}

interface WorkOrderItem {
  material_id: number
  quantity: number
}

interface WorkOrder {
  id: number
  title: string
  customer: string
  status: string
  created_at: string
}

export default function Delniki() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState("")
  const [customer, setCustomer] = useState("")
  const [items, setItems] = useState<WorkOrderItem[]>([{ material_id: 0, quantity: 0 }])

  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: mats } = await supabase.from("materials").select("id, name, unit, current_stock").order("name")
    const { data: wos } = await supabase.from("work_orders").select("*").order("created_at", { ascending: false })
    setMaterials(mats || [])
    setWorkOrders(wos || [])
    setLoading(false)
  }

  const addItem = () => setItems([...items, { material_id: 0, quantity: 0 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof WorkOrderItem, value: number) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const handleCreate = async () => {
    setError("")
    if (!title.trim()) {
      setError("Vpiši naziv delovnega naloga.")
      return
    }
    const validItems = items.filter(it => it.material_id > 0 && it.quantity > 0)
    if (validItems.length === 0) {
      setError("Dodaj vsaj en material s količino.")
      return
    }

    setSaving(true)

    const { data: wo, error: woError } = await supabase
      .from("work_orders")
      .insert([{ title: title.trim(), customer: customer.trim(), status: "open" }])
      .select()
      .single()

    if (woError || !wo) {
      setError("Napaka pri ustvarjanju naloga: " + (woError?.message || "neznan problem"))
      setSaving(false)
      return
    }

    const { error: itemsError } = await supabase.from("work_order_items").insert(
      validItems.map(it => ({ work_order_id: wo.id, material_id: it.material_id, quantity: it.quantity }))
    )

    if (itemsError) {
      setError("Napaka pri dodajanju materialov: " + itemsError.message)
      setSaving(false)
      return
    }

    setTitle("")
    setCustomer("")
    setItems([{ material_id: 0, quantity: 0 }])
    setShowModal(false)
    setSaving(false)
    setSuccess(true)
    fetchAll()
    setTimeout(() => setSuccess(false), 3000)
  }

  const closeWorkOrder = async (wo: WorkOrder) => {
    const { data: woItems } = await supabase
      .from("work_order_items")
      .select("*")
      .eq("work_order_id", wo.id)

    if (woItems) {
      for (const item of woItems) {
        const mat = materials.find(m => m.id === item.material_id)
        if (!mat) continue
        await supabase.from("materials").update({ current_stock: mat.current_stock - item.quantity }).eq("id", item.material_id)
        await supabase.from("stock_movements").insert([{ material_id: item.material_id, type: "out", quantity: item.quantity, note: `Delovni nalog: ${wo.title}` }])
      }
    }

    await supabase.from("work_orders").update({ status: "closed" }).eq("id", wo.id)
    fetchAll()
  }

  const getStatusBadge = (status: string) => {
    if (status === "open") return { label: "🟡 Odprt", color: "#d97706", bg: "#fffbeb" }
    if (status === "closed") return { label: "✅ Zaključen", color: "#059669", bg: "#f0fdf4" }
    return { label: status, color: "#6b7280", bg: "#f9fafb" }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", minWidth: "240px", background: "#1c1c1c", color: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#c41230", padding: "16px 20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>🖨️ Tiskarna</div>
          <div style={{ fontSize: "11px", color: "#ffcdd2" }}>Zaloga materialov</div>
        </div>
        <div style={{ padding: "16px 12px", flex: 1 }}>
          {[
            { icon: "📊", label: "Pregled zaloge", active: false, href: "/pregled-zaloge" },
            { icon: "📥", label: "Prevzem blaga", active: false, href: "/prevzem" },
            { icon: "📤", label: "Poraba", active: false, href: "/poraba" },
            { icon: "📋", label: "Delovni nalogi", active: true, href: "/delniki" },
            { icon: "🏭", label: "Dobavitelji", active: false, href: "#" },
            { icon: "📈", label: "Poročila", active: false, href: "#" },
          ].map((item) => (
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

      {/* VSEBINA */}
      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Delovni nalogi</h1>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Ustvari nalog in ob zaključku se zaloga avtomatsko odšteje.</p>
          </div>
          <button onClick={() => { setShowModal(true); setError("") }} style={{ padding: "10px 18px", background: "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
            + Nov delovni nalog
          </button>
        </div>

        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "14px 18px", marginBottom: "24px", color: "#16a34a", fontWeight: "500", fontSize: "14px" }}>
            ✅ Delovni nalog uspešno ustvarjen!
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["#", "Naziv", "Stranka", "Status", "Datum", "Akcije"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    Še ni delovnih nalogov. Klikni <strong>+ Nov delovni nalog</strong>.
                  </td>
                </tr>
              ) : workOrders.map((wo, i) => {
                const badge = getStatusBadge(wo.status)
                return (
                  <tr key={wo.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "13px" }}>#{wo.id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>{wo.title}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{wo.customer || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", color: badge.color, background: badge.bg, border: `1px solid ${badge.color}44` }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{new Date(wo.created_at).toLocaleDateString("sl-SI")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {wo.status === "open" && (
                        <button onClick={() => closeWorkOrder(wo)}
                          style={{ padding: "5px 12px", background: "#059669", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                          ✅ Zaključi
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "560px", maxHeight: "85vh", overflowY: "auto", borderRadius: "8px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>Nov delovni nalog</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>

            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Naziv naloga *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Npr. Tisk posterjev za stranko X"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Stranka</label>
              <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Ime stranke"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "10px" }}>Materiali</label>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                  <select value={item.material_id} onChange={e => updateItem(i, "material_id", parseInt(e.target.value))}
                    style={{ flex: 2, padding: "9px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", background: "white" }}>
                    <option value={0}>-- Material --</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.current_stock} {m.unit})</option>)}
                  </select>
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} placeholder="Kol."
                    style={{ flex: 1, padding: "9px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }} />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9ca3af" }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addItem} style={{ marginTop: "6px", padding: "7px 14px", border: "1px dashed #d1d5db", borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "13px", color: "#6b7280" }}>
                + Dodaj material
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", border: "1px solid #d1d5db", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Prekliči</button>
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: "10px 20px", background: saving ? "#9ca3af" : "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "bold" }}>
                {saving ? "Shranjujem..." : "✅ Ustvari nalog"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
