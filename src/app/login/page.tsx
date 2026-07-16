"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      toast.error("Email atau password salah")
      setLoading(false)
      return
    }

    toast.success("Berhasil login!")
    router.push("/pos")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-off-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brown font-serif">Forever Caffe</h1>
          <p className="text-brown-light mt-2">Point of Sale & Manajemen</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-cream-dark">
          <h2 className="text-xl font-semibold text-brown mb-6 text-center">Masuk ke Akun</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all"
                placeholder="admin@forevercaffe.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl bg-terracotta text-white font-semibold hover:bg-terracotta-light transition-colors disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  )
}
