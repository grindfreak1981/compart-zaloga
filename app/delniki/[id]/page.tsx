"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

interface WorkOrder {
  id: number
  title: string
  customer_id: number | null
  status: string
  created_at: string
  customers?: { name: string }
}

interface WorkOrderItem {
  id: number
  material_id: number
  quantity: number
  materials?: { name: string; unit: string }
}

const sidebarItems = [
  { icon: "🏠", label: "Dashboard", active: false, href: "/" },
  { icon: "📊", label: "Pregled zaloge", active: false, href: "/pregled-zaloge" },
  { icon: "📥", label: "Prevzem blaga", active: false, href: "/prevzem" },
  { icon: "📤", label: "Poraba", active: false, href: "/poraba" },
  { icon: "📋", label: "Delovni nalogi", active: true, href: "/delniki" },
  { icon: "👥", label: "Stranke", active: false, href: "/stranke" },
  { icon: "🏭", label: "Dobavitelji", active: false, href: "/dobavitelji" },
  { icon: "📈", label: "Poročila", active: false, href: "/porocila" },
]

export default function DelnikDetail() {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [items, setItems] = useState<WorkOrderItem[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const id = params.id

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: wo } = await supabase.from("work_orders").select("*, customers(name)").eq("id", id).single()
    const { data: woItems } = await supabase.from("work_order_items").select("*, materials(name, unit)").eq("work_order_id", id)
    const { data: mats } = await supabase.from("materials").select("id, name, unit, current_stock")
    setWorkOrder(wo)
    setItems(woItems || [])
    setMaterials(mats || [])
    setLoading(false)
  }

  const closeWorkOrder = async () => {
    if (!workOrder) return
    setClosing(true)
    for (const item of items) {
      const mat = materials.find(m => m.id === item.material_id)
      if (!mat) continue
      await supabase.from("materials").update({ current_stock: mat.current_stock - item.quantity }).eq("id", item.material_id)
      await supabase.from("stock_movements").insert([{ material_id: item.material_id, type: "out", quantity: item.quantity, note: `Delovni nalog: ${workOrder.title}` }])
    }
    await supabase.from("work_orders").update({ status: "closed" }).eq("id", workOrder.id)
    setClosing(false)
    fetchAll()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const getStatusBadge = (status: string) => {
    if (status === "open") return { label: "🟡 Odprt", color: "#d97706", bg: "#fffbeb" }
    if (status === "closed") return { label: "✅ Zaključen", color: "#059669", bg: "#f0fdf4" }
    return { label: status, color: "#6b7280", bg: "#f9fafb" }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  if (!workOrder) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalog ne obstaja.</div>
  )

  const badge = getStatusBadge(workOrder.status)

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
        <button onClick={() => router.push("/delniki")} style={{
          background: "none", border: "none", cursor: "pointer", color: "#6b7280",
          fontSize: "13px", marginBottom: "24px", padding: 0, display: "flex", alignItems: "center", gap: "6px"
        }}>
          ← Nazaj na delovne naloge
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>{workOrder.title}</h1>
              <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: "500", color: badge.color, background: badge.bg, border: `1px solid ${badge.color}44` }}>
                {badge.label}
              </span>
            </div>
            <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#6b7280" }}>
              <span>#{workOrder.id}</span>
              <span>👥 {workOrder.customers?.name || "Brez stranke"}</span>
              <span>📅 {new Date(workOrder.created_at).toLocaleDateString("sl-SI")}</span>
            </div>
          </div>
          {workOrder.status === "open" && (
            <button onClick={closeWorkOrder} disabled={closing} style={{
              padding: "10px 20px", background: closing ? "#9ca3af" : "#059669",
              color: "white", border: "none", borderRadius: "6px", cursor: closing ? "not-allowed" : "pointer",
              fontSize: "14px", fontWeight: "bold"
            }}>
              {closing ? "Zaključujem..." : "✅ Zaključi nalog"}
            </button>
          )}
        </div>

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", margin: 0 }}>Materiali na nalogu</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Material", "Enota", "Količina"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>Ta nalog nima materialov.</td>
                </tr>
              ) : items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>{item.materials?.name || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{item.materials?.unit || "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#c41230", fontSize: "13px" }}>{item.quantity.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
