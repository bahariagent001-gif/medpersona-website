"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"password" | "magic_link">("password")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("Email atau password salah")
      setLoading(false)
      return
    }

    router.push(redirectTo || "/dashboard")
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo || "/dashboard"}`,
      },
    })

    if (error) {
      setError("Gagal mengirim link. Periksa email Anda.")
      setLoading(false)
      return
    }

    setMagicLinkSent(true)
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div className="mt-6 rounded-lg border border-teal/20 bg-teal-light p-6 text-center">
        <p className="font-medium text-teal-dark">Link login terkirim!</p>
        <p className="mt-2 text-sm text-gray-600">
          Periksa email <strong>{email}</strong> dan klik link untuk masuk.
        </p>
        <button
          onClick={() => { setMagicLinkSent(false); setMode("password") }}
          className="mt-4 text-sm text-teal-dark hover:underline"
        >
          Kembali ke login
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
      className="mt-6 space-y-4"
    >
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy-dark">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="anda@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {mode === "password" && (
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-dark">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Password Anda"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Memproses..."
          : mode === "password"
          ? "Masuk"
          : "Kirim Magic Link"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode(mode === "password" ? "magic_link" : "password")}
          className="text-sm text-gray-500 hover:text-teal-dark"
        >
          {mode === "password"
            ? "Masuk dengan magic link (tanpa password)"
            : "Masuk dengan password"}
        </button>
      </div>
    </form>
  )
}
