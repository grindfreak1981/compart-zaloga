"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push("/pregled-zaloge")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Leva stran – enaka kot prej */}
      <div className="hidden md:flex w-1/2 flex-col bg-[#1c1c1c] text-white">
        <div className="bg-[#c41230] px-10 py-6 flex items-center justify-between">
          <div className="bg-white text-[#1c1c1c] px-4 py-2 font-bold text-lg">
            ▶Compart
          </div>
          <div className="text-xs text-red-100 text-right">
            🛒 PRIJAVA<br />
            <span className="text-[10px]">Interno orodje</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-16 space-y-6">
          <div className="text-5xl">🖨️</div>
          <div>
            <h1 className="text-2xl font-semibold">Zaloga materialov</h1>
            <p className="text-sm text-gray-300 mt-1">
              Interno orodje za upravljanje zaloge tiskarskih materialov.
            </p>
          </div>

          <div className="h-px w-40 bg-[#c41230]" />

          <ul className="space-y-3 text-sm text-gray-300">
            <li>📦 Pregled zaloge v realnem času</li>
            <li>⚠️ Opozorila pri nizki zalogi</li>
            <li>🌐 Dostop odkoderkoli</li>
          </ul>
        </div>

        <div className="px-10 py-4 text-[11px] text-gray-500">
          © 2026 Compart · Interno orodje
        </div>
      </div>

      {/* Desna stran – login forma z auth */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 md:px-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#1c1c1c]">
              Dobrodošli nazaj
            </h2>
            <p className="text-sm text-gray-500">
              Prijavite se v sistem Compart.
            </p>
            <div className="mt-2 h-1 w-24 bg-[#c41230]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail naslov</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ime@compart.si"
                className="bg-[#f5f5f5] border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Geslo</Label>
                <button
                  type="button"
                  className="text-xs text-[#c41230] hover:underline"
                >
                  Pozabljeno geslo?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#f5f5f5] border-gray-200"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#c41230] hover:bg-[#a00e26]"
              disabled={loading}
            >
              {loading ? "Prijavljanje..." : "PRIJAVA →"}
            </Button>

            <div className="rounded border border-red-200 bg-[#fdf2f4] px-3 py-2 text-[11px] text-[#7f1d1d]">
              🔒 Dostop je namenjen izključno pooblaščenim zaposlenim.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
