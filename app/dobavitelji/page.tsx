"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

interface Supplier {
  id: number
  name: string
  contact: string
  phone: string
  email: string
  notes: string
  created_at: string
}

export default function Dobavitelji() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("*").order("name")
    setSuppliers(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditSupplier(null)
    setForm({ name: "", contact: "", phone: "", email: "", notes: "" })
    setError("")
    setShowModal(true)
  }

  const openEdit = (s: Supplier) => {
    setEditSupplier(s)
    setForm({ name: s.name, contact: s.contact || "", phone: s.phone || "", email: s.email || "", notes: s.notes || "" })
    setError("")
    setShowModal(true)
  }

  const handleSave = async () => {
    setError("")
    if (!form.name.trim()) { setError("Vpiši naziv dobavitelja."); return }
    setSaving(true)
    if (editSupplier) {
      const { error: e } = await supabase.from("suppliers").update({ name: form.name.trim(), contact: form.contact, phone: form.phone, email: form.email, notes: form.notes }).eq("id", editSupplier.id)
      if (e) { setError("Napaka: " + e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from("suppliers").insert([{ name: form.name.trim(), contact: form.contact, phone: form.phone, email: form.email, notes: form.notes }])
      if (e) { setError("Napaka: " + e.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchSuppliers()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Res želiš izbrisati tega dobavitelja?")) return
    await supabase.from("suppliers").delete().eq("id", id)
    fetchSuppliers()
  }

  const sidebarItems = [
    { icon: "📊", label: "Pregled zaloge", active: false, href: "/pregled-zaloge" },
    { icon: "📥", label: "Prevzem blaga", active: false, href: "/prevzem" },
    { icon: "📤", label: "Poraba", active: false, href: "/poraba" },
    { icon: "📋", label: "Delovni nalogi", active: false, href: "/delniki" },
    { icon: "👥", label: "Stranke", active: false, href: "/stranke" },
    { icon: "🏭", label: "Dobavitelji", active: true, href: "/dobavitelji" },
    { icon: "📈", label: "Poročila", active: false, href: "/porocila" },
  ]

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Dobavitelji</h1>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Evidenca dobaviteljev.</p>
          </div>
          <button onClick={openAdd} style={{ padding: "10px 18px", background: "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
            + Dodaj dobavitelja
          </button>
        </div>

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Naziv", "Kontakt", "Telefon", "Email", "Akcije"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    Še ni dodanih dobaviteljev. Klikni <strong>+ Dodaj dobavitelja</strong>.
                  </td>
                </tr>
              ) : suppliers.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>{s.name}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{s.contact || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{s.phone || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{s.email || "—"}</td>
                  <td style={{ padding: "12px 16px", display: "flex", gap: "8px" }}>
                    <button onClick={() => openEdit(s)} style={{ padding: "5px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>✏️ Uredi</button>
                    <button onClick={() => handleDelete(s.id)} style={{ padding: "5px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🗑️ Izbriši</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "500px", borderRadius: "8px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>{editSupplier ? "Uredi dobavitelja" : "Nov dobavitelj"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>⚠️ {error}</div>
            )}
            {[
              { label: "Naziv dobavitelja *", key: "name", placeholder: "Npr. Papir d.o.o." },
              { label: "Kontaktna oseba", key: "contact", placeholder: "Ime in priimek" },
              { label: "Telefon", key: "phone", placeholder: "+386 ..." },
              { label: "Email", key: "email", placeholder: "info@dobavitelj.si" },
              { label: "Opombe", key: "notes", placeholder: "Dodatne informacije..." },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>{field.label}</label>
                <input value={form[field.key as keyof typeof form]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
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
