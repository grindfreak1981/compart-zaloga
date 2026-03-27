"use client"

import { createClient } from "@/lib/supabase"
import { isAdmin } from "@/lib/permissions"
import type { Profile } from "@/lib/permissions"

const allItems = [
  { icon: "🏠", label: "Dashboard", href: "/" },
  { icon: "📊", label: "Pregled zaloge", href: "/pregled-zaloge" },
  { icon: "📥", label: "Prevzem blaga", href: "/prevzem" },
  { icon: "📤", label: "Poraba", href: "/poraba" },
  { icon: "📋", label: "Delovni nalogi", href: "/delniki" },
  { icon: "👥", label: "Stranke", href: "/stranke" },
  { icon: "🏭", label: "Dobavitelji", href: "/dobavitelji" },
  { icon: "📈", label: "Poročila", href: "/porocila" },
]

const adminItem = { icon: "⚙️", label: "Uporabniki", href: "/admin/users" }

interface SidebarProps {
  active: string
  profile: Profile | null
}

export default function Sidebar({ active, profile }: SidebarProps) {
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const items = isAdmin(profile) ? [...allItems, adminItem] : allItems

  const roleLabel: Record<string, string> = {
    admin: "🔴 Admin",
    vodja: "🟡 Vodja",
    delavec: "🟢 Delavec",
  }

  return (
    <div style={{ width: "240px", minWidth: "240px", background: "#1c1c1c", color: "white", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#c41230", padding: "16px 20px" }}>
        <div style={{ fontWeight: "bold", fontSize: "18px" }}>🖨️ Tiskarna</div>
        <div style={{ fontSize: "11px", color: "#ffcdd2" }}>Zaloga materialov</div>
      </div>

      {profile && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a2a", background: "#141414" }}>
          <div style={{ fontSize: "13px", fontWeight: "500", color: "white", marginBottom: "2px" }}>
            {profile.full_name || profile.email}
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>{roleLabel[profile.role] || profile.role}</div>
        </div>
      )}

      <div style={{ padding: "16px 12px", flex: 1 }}>
        {items.map((item) => {
          const isActive = active === item.href
          return (
            <a key={item.href} href={item.href} style={{
              display: "block", padding: "10px 14px", borderRadius: "6px", marginBottom: "4px",
              background: isActive ? "rgba(196,18,48,0.25)" : "transparent",
              borderLeft: isActive ? "3px solid #c41230" : "3px solid transparent",
              color: isActive ? "white" : "#9ca3af",
              cursor: "pointer", fontSize: "13px", textDecoration: "none",
            }}>
              {item.icon}&nbsp;&nbsp;{item.label}
            </a>
          )
        })}
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
  )
}
