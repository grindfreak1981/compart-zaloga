"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
}

interface WorkOrderMaterial {
  material_id: number
  quantity: number
}

interface WorkOrder {
  id: number
  title: string
  status: string
  client?: string
  note?: string
  created_at: string
  completed_at?: string
}

const SIDEBAR_ITEMS = [
  { icon: "📊", label: "Pregled zaloge", href: "/pregled-zaloge" },
  { icon: "📥", label: "Prevzem blaga", href: "/prevzem" },
  { icon: "📤", label: "Poraba", href: "/poraba" },
  { icon: "📋", label: "Delovni nalogi", href: "/delniki", active: true },
  { icon: "🏭", label: "Dobavitelji", href: "#" },
  { icon: "📈", label: "Poročila", href: "#" },
]

function Sidebar() {
  return (
    <div style={{ width: "240px", minWidth: "240px", background: "#1c1c1c", color: "white", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#c41230", padding: "16px 20px" }}>
        <div style={{ fontWeight: "bold", fontSize: "18px" }}>🖨️ Tiskarna</div>
        <div style={{ fontSize: "11px", color: "#ffcdd2" }}>Zaloga materialov</div>
      </div>
      <div style={{ padding: "16px 12px", flex: 1 }}>
        {SIDEBAR_ITEMS.map((item) => (
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
      <div style={{ padding: "12px 20px", fontSize: "10px", color: "#4b5563", borderTop: "1px solid #2a2a2a" }}>
        © 2026 Compart
      </div>
    </div>
  )
}

export default function Delniki() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailId, setShowDetailId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [client, setClient] = useState("")
  const [note, setNote] = useState("")
  const [orderMaterials, setOrderMaterials] = useState<WorkOrderMaterial[]>([{ material_id: 0, quantity: 0 }])

  const supabase = createClient()

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const [{ data: orders }, { data: mats }] = await Promise.all([
      supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("materials").select("id, name, unit, current_stock").order("name"),
    ])
    setWorkOrders(orders || [])
    setMaterials(mats || [])
    setLoading(false)
  }

  const addMaterialRow = () => {
    setOrderMaterials([...orderMaterials, { material_id: 0, quantity: 0 }])
  }

  const removeMaterialRow = (index: number) => {
    setOrderMaterials(orderMaterials.filter((_, i) => i !== index))
  }

  const updateMaterialRow = (index: number, field: keyof WorkOrderMaterial, value: number) => {
    const updated = [...orderMaterials]
    updated[index] = { ...updated[index], [field]: value }
    setOrderMaterials(updated)
  }

  const createWorkOrder = async () => {
    if (!title) return

    const { data: order, error } = await supabase
      .from("work_orders")
      .insert([{ title, client, note, status: "open" }])
      .select()
      .single()

    if (error || !order) return

    const validMaterials = orderMaterials.filter(m => m.material_id > 0 && m.quantity > 0)
    if (validMaterials.length > 0) {
      await supabase.from("work_order_materials").insert(
        validMaterials.map(m => ({ work_order_id: order.id, material_id: m.material_id, quantity: m.quantity }))
      )
    }

    setShowModal(false)
    setTitle("")
    setClient("")
    setNote("")
    setOrderMaterials([{ material_id: 0, quantity: 0 }])
    fetchAll()
  }

  const completeWorkOrder = async (orderId: number) => {
    const { data: orderMats } = await supabase
      .from("work_order_materials")
      .select("material_id, quantity")
      .eq("work_order_id", orderId)

    if (orderMats && orderMats.length > 0) {
      for (const om of orderMats) {
        const mat = materials.find(m => m.id === om.material_id)
        if (!mat) continue

        await supabase
          .from("materials")
          .update({ current_stock: Math.max(0, mat.current_stock - om.quantity) })
          .eq("id", om.material_id)

        await supabase.from("stock_movements").insert([{
          material_id: om.material_id,
          type: "out",
          quantity: om.quantity,
          note: `Delovni nalog #${orderId}`,
        }])
      }
    }

    await supabase
      .from("work_orders")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", orderId)

    setShowDetailId(null)
    fetchAll()
  }

  const deleteWorkOrder = async (id: number) => {
    await supabase.from("work_orders").delete().eq("id", id)
    fetchAll()
  }

  const getStatusLabel = (status: string) => {
    if (status === "open") return { label: "Odprt", color: "#2563eb", bg: "#eff6ff" }
    if (status === "in_progress") return { label: "V teku", color: "#d97706", bg: "#fffbeb" }
    return { label: "Zaključen", color: "#059669", bg: "#f0fdf4" }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
      Nalagam...
    </div>
  )

  const openOrders = workOrders.filter(o => o.status !== "done").length

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Delovni nalogi</h1>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>
              Ustvari nalog, dodaj materiale in zaključi – zaloga se odšteje avtomatsko.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: "8px 16px", background: "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
          >
            + Nov nalog
          </button>
        </div>

        {/* KARTICE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { value: workOrders.length, label: "Skupaj nalogov", color: "#c41230" },
            { value: openOrders, label: "Odprti nalogi", color: "#2563eb" },
            { value: workOrders.filter(o => o.status === "done").length, label: "Zaključeni", color: "#059669" },
          ].map(card => (
            <div key={card.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: card.color }}>{card.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* TABELA */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Naziv naloga", "Stranka", "Status", "Ustvarjen", "Akcije"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    Še ni delovnih nalogov. Klikni <strong>+ Nov nalog</strong>.
                  </td>
                </tr>
              ) : workOrders.map((order, i) => {
                const status = getStatusLabel(order.status)
                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>{order.title}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{order.client || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", color: status.color, background: status.bg, border: `1px solid ${status.color}44` }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>
                      {new Date(order.created_at).toLocaleDateString("sl-SI")}
                    </td>
                    <td style={{ padding: "12px 16px", display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setShowDetailId(order.id)}
                        style={{ padding: "5px 12px", background: "#2563eb", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Odpri
                      </button>
                      {order.status !== "done" && (
                        <button
                          onClick={() => completeWorkOrder(order.id)}
                          style={{ padding: "5px 12px", background: "#059669", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}
                        >
                          ✓ Zaključi
                        </button>
                      )}
                      <button
                        onClick={() => deleteWorkOrder(order.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL – Nov nalog */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "560px", maxHeight: "90vh", overflowY: "auto", borderRadius: "8px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>Nov delovni nalog</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Naziv naloga *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Npr. Tisk katalogov – april 2026"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Stranka</label>
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="Ime stranke"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Opomba</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Dodatne informacije..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
            </div>

            {/* MATERIALI */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>Materiali za nalog</label>
                <button onClick={addMaterialRow} style={{ padding: "4px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}>
                  + Dodaj material
                </button>
              </div>
              {orderMaterials.map((row, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                  <select value={row.material_id} onChange={e => updateMaterialRow(i, "material_id", parseInt(e.target.value))}
                    style={{ flex: 2, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", background: "white" }}>
                    <option value={0}>-- Izberi --</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.current_stock} {m.unit})</option>
                    ))}
                  </select>
                  <input type="number" value={row.quantity} onChange={e => updateMaterialRow(i, "quantity", parseFloat(e.target.value) || 0)}
                    placeholder="Količina" min={0}
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }} />
                  <button onClick={() => removeMaterialRow(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9ca3af" }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", border: "1px solid #d1d5db", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                Prekliči
              </button>
              <button onClick={createWorkOrder} disabled={!title}
                style={{ padding: "10px 20px", background: title ? "#c41230" : "#9ca3af", color: "white", border: "none", borderRadius: "6px", cursor: title ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: "bold" }}>
                Ustvari nalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailId && (
        <WorkOrderDetail
          orderId={showDetailId}
          materials={materials}
          supabase={supabase}
          onClose={() => setShowDetailId(null)}
          onComplete={() => completeWorkOrder(showDetailId)}
        />
      )}
    </div>
  )
}

function WorkOrderDetail({ orderId, materials, supabase, onClose, onComplete }: {
  orderId: number
  materials: Material[]
  supabase: any
  onClose: () => void
  onComplete: () => void
}) {
  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [orderMats, setOrderMats] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from("work_orders").select("*").eq("id", orderId).single(),
      supabase.from("work_order_materials").select("*").eq("work_order_id", orderId),
    ]).then(([{ data: o }, { data: m }]) => {
      setOrder(o)
      setOrderMats(m || [])
    })
  }, [orderId])

  if (!order) return null

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "520px", borderRadius: "8px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>{order.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>

        {order.client && <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>👤 {order.client}</p>}
        {order.note && <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>📝 {order.note}</p>}

        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>Materiali:</h3>
        {orderMats.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Ni dodanih materialov.</p>
        ) : (
          <div style={{ background: "#f9fafb", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
            {orderMats.map((om, i) => {
              const mat = materials.find(m => m.id === om.material_id)
              const enough = mat && mat.current_stock >= om.quantity
              return (
                <div key={om.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < orderMats.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                  <span style={{ fontSize: "13px", color: "#111827" }}>{mat?.name || "—"}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: enough ? "#059669" : "#dc2626" }}>
                    {om.quantity} {mat?.unit} {!enough && "⚠️ premalo"}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {order.status !== "done" && (
          <button onClick={onComplete}
            style={{ width: "100%", padding: "12px", background: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" }}>
            ✓ Zaključi nalog in odštej zalogo
          </button>
        )}
        {order.status === "done" && (
          <div style={{ textAlign: "center", color: "#059669", fontWeight: "500", fontSize: "14px" }}>
            ✅ Nalog zaključen – zaloga je bila odšteta.
          </div>
        )}
      </div>
    </div>
  )
}
