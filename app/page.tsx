"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import Sidebar from "@/components/Sidebar"

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock: number
}

interface WorkOrder {
  id: number
  title: string
  status: string
  created_at: string
  customers?: { name: string }
}

export default function Dashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const [materials, setMaterials] = useState<Material[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: mats } = await supabase.from("materials").select("id, name, unit, current_stock, min_stock").order("name")
    const { data: wos } = await supabase.from("work_orders").select("*, customers(name)").order("created_at", { ascending: false }).limit(5)
    setMaterials(mats || [])
    setWorkOrders(wos || [])
    setLoading(false)
  }

  const kriticni = materials.filter(m => m.current_stock === 0)
  const nizki = materials.filter(m => m.current_stock > 0 && m.current_stock < m.min_stock)
  const odprti = workOrders.filter(w => w.status === "open")

  if (loading || profileLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar active="/" profile={profile} />

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "4px 0 0 0" }}>
            {new Date().toLocaleDateString("sl-SI", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { value: materials.length, label: "Vsi materiali", color: "#c41230", icon: "📦", href: "/pregled-zaloge" },
            { value: odprti.length, label: "Odprti nalogi", color: "#3b82f6", icon: "📋", href: "/delniki" },
            { value: nizki.length, label: "Nizka zaloga", color: "#d97706", icon: "⚠️", href: "/pregled-zaloge" },
            { value: kriticni.length, label: "Brez zaloge", color: "#dc2626", icon: "🔴", href: "/pregled-zaloge" },
          ].map((card) => (
            <a key={card.label} href={card.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", borderTop: `3px solid ${card.color}`, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: card.color }}>{card.value}</div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{card.label}</div>
                  </div>
                  <div style={{ fontSize: "28px" }}>{card.icon}</div>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "bold", color: "#111827", margin: 0 }}>⚠️ Opozorila zaloge</h2>
              <a href="/pregled-zaloge" style={{ fontSize: "12px", color: "#c41230", textDecoration: "none" }}>Vsi materiali →</a>
            </div>
            <div style={{ padding: "8px 0" }}>
              {kriticni.length === 0 && nizki.length === 0 ? (
                <div style={{ padding: "24px 20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>✅ Vsa zaloga je v redu!</div>
              ) : (
                <>
                  {kriticni.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #f3f4f6", background: "#fff5f5" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: "#111827" }}>{m.name}</div>
                        <div style={{ fontSize: "11px", color: "#dc2626" }}>Zaloga: 0 {m.unit}</div>
                      </div>
                      <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "500", color: "#dc2626", background: "#fee2e2" }}>🔴 Kritično</span>
                    </div>
                  ))}
                  {nizki.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #f3f4f6", background: "#fffbeb" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: "#111827" }}>{m.name}</div>
                        <div style={{ fontSize: "11px", color: "#d97706" }}>Zaloga: {m.current_stock} / min. {m.min_stock} {m.unit}</div>
                      </div>
                      <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "500", color: "#d97706", background: "#fef3c7" }}>⚠️ Nizko</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "bold", color: "#111827", margin: 0 }}>📋 Zadnji delovni nalogi</h2>
              <a href="/delniki" style={{ fontSize: "12px", color: "#c41230", textDecoration: "none" }}>Vsi nalogi →</a>
            </div>
            <div style={{ padding: "8px 0" }}>
              {workOrders.length === 0 ? (
                <div style={{ padding: "24px 20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>Še ni delovnih nalogov.</div>
              ) : workOrders.map((wo, i) => {
                const isOpen = wo.status === "open"
                return (
                  <a key={wo.id} href={`/delniki/${wo.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa")}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: "#111827" }}>{wo.title}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{wo.customers?.name || "Brez stranke"} · {new Date(wo.created_at).toLocaleDateString("sl-SI")}</div>
                      </div>
                      <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "500", color: isOpen ? "#d97706" : "#059669", background: isOpen ? "#fef3c7" : "#dcfce7" }}>
                        {isOpen ? "🟡 Odprt" : "✅ Zaključen"}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>Hitre povezave</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "📥 Nov prevzem", href: "/prevzem", color: "#059669" },
              { label: "📤 Zabeleži porabo", href: "/poraba", color: "#c41230" },
              { label: "📋 Nov delovni nalog", href: "/delniki", color: "#3b82f6" },
              { label: "📊 Pregled zaloge", href: "/pregled-zaloge", color: "#6b7280" },
              { label: "📈 Poročila", href: "/porocila", color: "#8b5cf6" },
            ].map(link => (
              <a key={link.label} href={link.href} style={{ padding: "10px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: "500", textDecoration: "none", color: "white", background: link.color }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
