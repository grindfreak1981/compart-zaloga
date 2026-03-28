"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import Sidebar from "@/components/Sidebar"

interface Customer {
  id: number
  name: string
  contact: string
  phone: string
  email: string
  notes: string
  created_at: string
}

export default function Stranke() {
  const { profile, loading: profileLoading } = useProfile()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()
  const canEdit = hasPermission(profile, PERMISSIONS.EDIT_CUSTOMERS)

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("name")
    setCustomers(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditCustomer(null)
    setForm({ name: "", contact: "", phone: "", email: "", notes: "" })
    setError("")
    setShowModal(true)
  }

  const openEdit = (c: Customer) => {
    setEditCustomer(c)
    setForm({ name: c.name, contact: c.contact || "", phone: c.phone || "", email: c.email || "", notes: c.notes || "" })
    setError("")
    setShowModal(true)
  }

  const handleSave = async () => {
    setError("")
    if (!form.name.trim()) { setError("Vpiši naziv stranke."); return }
    setSaving(true)
    if (editCustomer) {
      const { error: e } = await supabase.from("customers").update({ name: form.name.trim(), contact: form.contact, phone: form.phone, email: form.email, notes: form.notes }).eq("id", editCustomer.id)
      if (e) { setError("Napaka: " + e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from("customers").insert([{ name: form.name.trim(), contact: form.contact, phone: form.phone, email: form.email, notes: form.notes }])
      if (e) { setError("Napaka: " + e.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchCustomers()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Res želiš izbrisati to stranko?")) return
    await supabase.from("customers").delete().eq("id", id)
    fetchCustomers()
  }

  if (loading || profileLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar active="/stranke" profile={profile} />

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Stranke</h1>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Evidenca strank.</p>
          </div>
          {canEdit && (
            <button onClick={openAdd} style={{ padding: "10px 18px", background: "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
              + Dodaj stranko
            </button>
          )}
        </div>

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Naziv", "Kontakt", "Telefon", "Email", "Opombe", ...(canEdit ? ["Akcije"] : [])].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    Še ni dodanih strank. Klikni <strong>+ Dodaj stranko</strong>.
                  </td>
                </tr>
              ) : customers.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{c.contact || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{c.phone || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{c.email || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px", maxWidth: "200px" }}>{c.notes || "—"}</td>
                  {canEdit && (
                    <td style={{ padding: "12px 16px", display: "flex", gap: "8px" }}>
                      <button onClick={() => openEdit(c)} style={{ padding: "5px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>✏️ Uredi</button>
                      <button onClick={() => handleDelete(c.id)} style={{ padding: "5px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🗑️ Izbriši</button>
                    </td>
                  )}
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
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>{editCustomer ? "Uredi stranko" : "Nova stranka"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>⚠️ {error}</div>
            )}
            {[
              { label: "Naziv stranke *", key: "name", placeholder: "Npr. Podjetje d.o.o." },
              { label: "Kontaktna oseba", key: "contact", placeholder: "Ime in priimek" },
              { label: "Telefon", key: "phone", placeholder: "+386 ..." },
              { label: "Email", key: "email", placeholder: "info@podjetje.si" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>{field.label}</label>
                <input value={form[field.key as keyof typeof form]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Opombe</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Dodatne informacije..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }} />
            </div>
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