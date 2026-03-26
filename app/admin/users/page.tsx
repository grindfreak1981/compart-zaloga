"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { isAdmin, PERMISSIONS } from "@/lib/permissions"
import type { Profile } from "@/lib/permissions"
import Sidebar from "@/components/Sidebar"
import { useRouter } from "next/navigation"

const PERMISSION_LABELS: Record<string, string> = {
  view_stock: "📊 Pregled zaloge",
  edit_stock: "✏️ Urejanje materialov",
  stock_in: "📥 Prevzem blaga",
  stock_out: "📤 Poraba materiala",
  view_work_orders: "📋 Ogled delovnih nalogov",
  edit_work_orders: "🔧 Ustvarjanje/zaključevanje nalogov",
  view_customers: "👥 Ogled strank",
  edit_customers: "✏️ Urejanje strank",
  view_suppliers: "🏭 Ogled dobaviteljev",
  edit_suppliers: "✏️ Urejanje dobaviteljev",
  view_reports: "📈 Poročila",
}

export default function AdminUsers() {
  const { profile, loading: profileLoading } = useProfile()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [editForm, setEditForm] = useState({ role: "worker", permissions: {} as Record<string, boolean> })
  const [addForm, setAddForm] = useState({ email: "", full_name: "", password: "", role: "worker", permissions: {} as Record<string, boolean> })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!profileLoading && !isAdmin(profile)) router.push("/")
  }, [profile, profileLoading])

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name")
    setUsers(data || [])
    setLoading(false)
  }

  const openEdit = (user: Profile) => {
    setEditUser(user)
    setEditForm({ role: user.role, permissions: { ...user.permissions } })
    setError("")
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editUser) return
    setSaving(true)
    const { error: e } = await supabase.from("profiles").update({
      role: editForm.role,
      permissions: editForm.role === "worker" ? editForm.permissions : {},
    }).eq("id", editUser.id)
    if (e) { setError("Napaka: " + e.message); setSaving(false); return }
    setSaving(false)
    setShowModal(false)
    setSuccess("Uporabnik uspešno posodobljen!")
    fetchUsers()
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleAddUser = async () => {
    setError("")
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      setError("Izpolni vsa obvezna polja.")
      return
    }
    setSaving(true)
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: addForm.email,
        full_name: addForm.full_name,
        password: addForm.password,
        role: addForm.role,
        permissions: addForm.role === "worker" ? addForm.permissions : {},
      }),
    })
    const data = await res.json()
    if (data.error) { setError("Napaka: " + data.error); setSaving(false); return }
    setSaving(false)
    setShowAddModal(false)
    setAddForm({ email: "", full_name: "", password: "", role: "worker", permissions: {} })
    setSuccess("Uporabnik uspešno dodan!")
    fetchUsers()
    setTimeout(() => setSuccess(""), 3000)
  }

  const togglePermission = (key: string, form: Record<string, boolean>, setForm: (f: any) => void) => {
    setForm((prev: any) => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }))
  }

  const roleColors: Record<string, { color: string; bg: string; label: string }> = {
    admin: { color: "#dc2626", bg: "#fee2e2", label: "🔴 Admin" },
    manager: { color: "#d97706", bg: "#fef3c7", label: "🟡 Manager" },
    worker: { color: "#059669", bg: "#dcfce7", label: "🟢 Delavec" },
  }

  if (profileLoading || loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>Nalagam...</div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar active="/admin/users" profile={profile} />

      <div style={{ flex: 1, background: "#f8fafc", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0 }}>Upravljanje uporabnikov</h1>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>Dodajaj uporabnike in jim določaj vloge ter dovoljenja.</p>
          </div>
          <button onClick={() => { setShowAddModal(true); setError("") }} style={{ padding: "10px 18px", background: "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
            + Dodaj uporabnika
          </button>
        </div>

        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "14px 18px", marginBottom: "24px", color: "#16a34a", fontWeight: "500", fontSize: "14px" }}>
            ✅ {success}
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Ime in priimek", "Email", "Vloga", "Dovoljenja", "Akcije"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>Ni uporabnikov.</td>
                </tr>
              ) : users.map((user, i) => {
                const roleBadge = roleColors[user.role] || roleColors.worker
                const permCount = Object.values(user.permissions || {}).filter(Boolean).length
                const isCurrentUser = user.id === profile?.id
                return (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "500", color: "#111827", fontSize: "13px" }}>
                      {user.full_name || "—"}
                      {isCurrentUser && <span style={{ marginLeft: "8px", fontSize: "11px", color: "#6b7280" }}>(jaz)</span>}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{user.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", color: roleBadge.color, background: roleBadge.bg }}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>
                      {user.role === "worker" ? `${permCount} / ${Object.keys(PERMISSIONS).length} dovoljenj` : "Vse (vloga)"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => openEdit(user)} style={{ padding: "5px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>✏️ Uredi</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legenda vlog */}
        <div style={{ marginTop: "24px", background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#111827", margin: "0 0 12px 0" }}>Razlaga vlog</h3>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[
              { role: "admin", desc: "Dostop do vsega, vključno z upravljanjem uporabnikov" },
              { role: "manager", desc: "Dostop do vseh funkcij razen upravljanja uporabnikov" },
              { role: "worker", desc: "Dostop samo do izbranih funkcij (nastavljivo)" },
            ].map(r => (
              <div key={r.role} style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: "1", minWidth: "200px" }}>
                <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "500", color: roleColors[r.role].color, background: roleColors[r.role].bg, whiteSpace: "nowrap" }}>
                  {roleColors[r.role].label}
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL - Uredi uporabnika */}
      {showModal && editUser && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "520px", maxHeight: "85vh", overflowY: "auto", borderRadius: "8px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>Uredi uporabnika</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px" }}>
              <div style={{ fontWeight: "500", fontSize: "14px", color: "#111827" }}>{editUser.full_name}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{editUser.email}</div>
            </div>

            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>⚠️ {error}</div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Vloga</label>
              <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", background: "white", boxSizing: "border-box" }}>
                <option value="admin">🔴 Admin</option>
                <option value="manager">🟡 Manager</option>
                <option value="worker">🟢 Delavec</option>
              </select>
            </div>

            {editForm.role === "worker" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "10px" }}>Dovoljenja za delavca</label>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
                  {Object.entries(PERMISSION_LABELS).map(([key, label], i) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < Object.keys(PERMISSION_LABELS).length - 1 ? "1px solid #f3f4f6" : "none", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{label}</span>
                      <button
                        onClick={() => setEditForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }))}
                        style={{
                          width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                          background: editForm.permissions[key] ? "#c41230" : "#d1d5db",
                          position: "relative", transition: "background 0.2s"
                        }}>
                        <span style={{
                          position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white",
                          transition: "left 0.2s", left: editForm.permissions[key] ? "23px" : "3px"
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {/* MODAL - Dodaj uporabnika */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "520px", maxHeight: "85vh", overflowY: "auto", borderRadius: "8px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>Dodaj uporabnika</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>

            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>⚠️ {error}</div>
            )}

            {[
              { label: "Ime in priimek *", key: "full_name", type: "text", placeholder: "Janez Novak" },
              { label: "Email *", key: "email", type: "email", placeholder: "janez@podjetje.si" },
              { label: "Geslo *", key: "password", type: "password", placeholder: "Vsaj 6 znakov" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>{field.label}</label>
                <input
                  type={field.type}
                  value={addForm[field.key as keyof typeof addForm] as string}
                  onChange={e => setAddForm({ ...addForm, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Vloga</label>
              <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", background: "white", boxSizing: "border-box" }}>
                <option value="admin">🔴 Admin</option>
                <option value="manager">🟡 Manager</option>
                <option value="worker">🟢 Delavec</option>
              </select>
            </div>

            {addForm.role === "worker" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "10px" }}>Dovoljenja</label>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
                  {Object.entries(PERMISSION_LABELS).map(([key, label], i) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < Object.keys(PERMISSION_LABELS).length - 1 ? "1px solid #f3f4f6" : "none", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{label}</span>
                      <button
                        onClick={() => setAddForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }))}
                        style={{
                          width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                          background: addForm.permissions[key] ? "#c41230" : "#d1d5db",
                          position: "relative", transition: "background 0.2s"
                        }}>
                        <span style={{
                          position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white",
                          transition: "left 0.2s", left: addForm.permissions[key] ? "23px" : "3px"
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "10px 20px", border: "1px solid #d1d5db", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Prekliči</button>
              <button onClick={handleAddUser} disabled={saving}
                style={{ padding: "10px 20px", background: saving ? "#9ca3af" : "#c41230", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "bold" }}>
                {saving ? "Ustvarjam..." : "✅ Ustvari uporabnika"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
a