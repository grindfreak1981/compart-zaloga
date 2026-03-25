"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts"

interface Movement {
  id: number
  material_id: number
  type: string
  quantity: number
  created_at: string
}

interface Material {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock: number
}

const sidebarItems = [
  { icon: "📊", label: "Pregled zaloge", active: false, href: "/pregled-zaloge" },
  { icon: "📥", label: "Prevzem blaga", active: false, href: "/prevzem" },
  { icon: "📤", label: "Poraba", active: false, href: "/poraba" },
  { icon: "📋", label: "Delovni nalogi", active: false, href: "/delniki" },
  { icon: "👥", label: "Stranke", active: false, href: "/stranke" },
  { icon: "🏭", label: "Dobavitelji", active: false, href: "/dobavitelji" },
  { icon: "📈", label: "Poročila", active: true, href: "/porocila" },
]

export default function Porocila() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: mats } = await supabase.from("materials").select("*").order("name")
    const { data: movs } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: true })
    setMaterials(mats || [])
    setMovements(movs || [])
    setLoading(false)
  }

  // Poraba po materialih (top 10)
  const porabaPoMaterialih = materials.map(mat => {
    const poraba = movements
      .filter(m => m.material_id === mat.id && m.type === "out")
      .reduce((sum, m) => sum + Number(m.quantity), 0)
    const prevzem = movements
      .filter(m => m.material_id === mat.id && m.type === "in")
      .reduce((sum, m) => sum + Number(m.quantity), 0)
    return { name: mat.name.length > 20 ? mat.name.substring(0, 20) + "..." : mat.name, poraba, prevzem, unit: mat.unit }
  }).filter(m => m.poraba > 0 || m.prevzem > 0).sort((a, b) => b.poraba - a.poraba).slice(0, 10)

  // Gibanje zaloge po dnevih (zadnjih 30 dni)
  const zadnjih30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split("T")[0]
  })

  const gibanjePoDnevih = zadnjih30.map(dan => {
    const prevzem = movements
      .filter(m => m.created_at.startsWith(dan) && m.type === "in")
      .reduce((sum, m) => sum + Number(m.quantity), 0)
    const poraba = movements
      .filter(m => m.created_at.startsWith(dan) && m.type === "out")
      .reduce((sum, m) => sum + Number(m.quantity), 0)
    return {
      dan: dan.substring(5),
      prevzem,
      poraba,
    }
  })

  // Statistike
  const skupnaPoraba = movements.filter(m => m.type === "out").reduce((sum, m) => sum + Number(m.quantity), 0)
  const skupniPrevzem = movements.filter(m => m.type === "in").reduce((sum, m) => sum + Number(m.quantity), 0)
  const kriticniMateriali = materials.filter(m => m.current_stock === 0).length
  const nizkaZaloga = materials.filter(m => m.current_stock > 0 && m.current_stock < m.min_stock).length

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
        <div style={{ padding: "12px 20px", fontSize: "10px", color: "#4b5563", borderTop: "1px solid #2a2a2a" }}>© 2026 Compart</div>
      </div>

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Poročila</h1>
          <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Pregled porabe in gibanja zaloge.</p>
        </div>

        {/* KARTICE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { value: skupniPrevzem.toLocaleString(), label: "Skupni prevzem", color: "#059669" },
            { value: skupnaPoraba.toLocaleString(), label: "Skupna poraba", color: "#c41230" },
            { value: kriticniMateriali, label: "Brez zaloge 🔴", color: "#dc2626" },
            { value: nizkaZaloga, label: "Nizka zaloga ⚠️", color: "#d97706" },
          ].map((card) => (
            <div key={card.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: card.color }}>{card.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* GRAF - Gibanje zadnjih 30 dni */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", marginTop: 0, marginBottom: "20px" }}>Gibanje zaloge — zadnjih 30 dni</h2>
          {gibanjePoDnevih.every(d => d.prevzem === 0 && d.poraba === 0) ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>Še ni podatkov za prikaz.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={gibanjePoDnevih}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="dan" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="prevzem" stroke="#059669" strokeWidth={2} dot={false} name="Prevzem" />
                <Line type="monotone" dataKey="poraba" stroke="#c41230" strokeWidth={2} dot={false} name="Poraba" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRAF - Poraba po materialih */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", marginTop: 0, marginBottom: "20px" }}>Poraba in prevzem po materialih (top 10)</h2>
          {porabaPoMaterialih.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>Še ni podatkov za prikaz.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={porabaPoMaterialih} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Legend />
                <Bar dataKey="prevzem" fill="#059669" name="Prevzem" radius={[0, 4, 4, 0]} />
                <Bar dataKey="poraba" fill="#c41230" name="Poraba" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* TABELA - Trenutna zaloga */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", margin: 0 }}>Trenutno stanje zaloge</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Material", "Enota", "Zaloga", "Min. zaloga", "Skupna poraba", "Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, i) => {
                const totalPoraba = movements.filter(m => m.material_id === mat.id && m.type === "out").reduce((sum, m) => sum + Number(m.quantity), 0)
                const status = mat.current_stock === 0
                  ? { label: "🔴 Kritično", color: "#dc2626" }
                  : mat.current_stock < mat.min_stock
                    ? { label: "⚠️ Nizko", color: "#d97706" }
                    : { label: "✅ OK", color: "#059669" }
                return (
                  <tr key={mat.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>{mat.name}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{mat.unit}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#111827", fontSize: "13px" }}>{mat.current_stock.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{mat.min_stock.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#c41230", fontWeight: "600", fontSize: "13px" }}>{totalPoraba.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", color: status.color, background: `${status.color}22`, border: `1px solid ${status.color}44` }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
