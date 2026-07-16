"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import {
  Cog6ToothIcon,
  CreditCardIcon,
  TagIcon,
  UserGroupIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

interface Settings {
  cafeName: string
  cafeLogo: string | null
  qrisImageUrl: string | null
  taxPercentage: number
}

interface Category {
  id: string
  name: string
  type: string
  _count?: { products: number }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

const DEFAULT_SETTINGS: Settings = {
  cafeName: "Forever Caffe",
  cafeLogo: null,
  qrisImageUrl: null,
  taxPercentage: 0,
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-cream rounded-2xl shadow-sm border border-cream-dark/50 ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-cream-dark/50">
      <div className="w-10 h-10 rounded-xl bg-brown/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brown" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-brown">{title}</h2>
        {subtitle && <p className="text-sm text-brown-light/70 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-brown mb-1.5">
      {children}
    </label>
  )
}

function Input({ id, type = "text", value, onChange, placeholder, step }: {
  id?: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; step?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white text-charcoal placeholder:text-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all text-sm"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all text-sm appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Badge({ variant = "default", children }: { variant?: "default" | "owner" | "kasir" | "makanan" | "minuman"; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    default: "bg-cream-dark text-brown",
    owner: "bg-gold/20 text-gold",
    kasir: "bg-terracotta/10 text-terracotta",
    makanan: "bg-green-100 text-green-800",
    minuman: "bg-blue-100 text-blue-800",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="relative bg-cream rounded-2xl shadow-xl border border-cream-dark w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-cream-dark/50">
          <h3 className="text-lg font-semibold text-brown">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-cream-dark/50 transition-colors">
            <XMarkIcon className="w-5 h-5 text-brown-light" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-cream rounded-2xl border border-cream-dark/50 p-6">
          <div className="h-5 w-40 bg-cream-dark rounded-lg mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-cream-dark rounded-xl" />
            <div className="h-10 bg-cream-dark rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingQris, setSavingQris] = useState(false)

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [formName, setFormName] = useState("")
  const [formLogo, setFormLogo] = useState("")
  const [formTax, setFormTax] = useState("0")
  const [formQris, setFormQris] = useState("")

  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState("makanan")
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [editCatName, setEditCatName] = useState("")
  const [editCatType, setEditCatType] = useState("")

  const [users, setUsers] = useState<User[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "kasir" })

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      if (data) {
        setSettings(data)
        setFormName(data.cafeName ?? "")
        setFormLogo(data.cafeLogo ?? "")
        setFormTax(String(data.taxPercentage ?? 0))
        setFormQris(data.qrisImageUrl ?? "")
      }
    } catch {
      toast.error("Gagal memuat pengaturan")
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      const data = await res.json()
      setCategories(data)
    } catch {
      toast.error("Gagal memuat kategori")
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data)
    } catch {
      toast.error("Gagal memuat pengguna")
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchSettings(), fetchCategories(), fetchUsers()])
    setLoading(false)
  }, [fetchSettings, fetchCategories, fetchUsers])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      loadAll()
    }
  }, [status, loadAll, router])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeName: formName.trim() || "Forever Caffe",
          cafeLogo: formLogo.trim() || null,
          taxPercentage: parseFloat(formTax) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      const data = await res.json()
      setSettings(data)
      toast.success("Pengaturan kafe disimpan")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveQris = async () => {
    setSavingQris(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrisImageUrl: formQris.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      const data = await res.json()
      setSettings(data)
      toast.success("Pengaturan QRIS disimpan")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan QRIS")
    } finally {
      setSavingQris(false)
    }
  }

  const handleResetDefault = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_SETTINGS),
      })
      if (!res.ok) throw new Error("Failed to reset")
      const data = await res.json()
      setSettings(data)
      setFormName(data.cafeName ?? "")
      setFormLogo(data.cafeLogo ?? "")
      setFormTax(String(data.taxPercentage ?? 0))
      setFormQris(data.qrisImageUrl ?? "")
      toast.success("Pengaturan direset ke default")
    } catch {
      toast.error("Gagal mereset pengaturan")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Nama kategori harus diisi")
      return
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), type: newCatType }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create")
      }
      const cat = await res.json()
      setCategories((prev) => [cat, ...prev])
      setNewCatName("")
      setNewCatType("makanan")
      toast.success("Kategori ditambahkan")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah kategori")
    }
  }

  const handleEditCategory = async () => {
    if (!editingCat || !editCatName.trim()) {
      toast.error("Nama kategori harus diisi")
      return
    }
    try {
      const res = await fetch(`/api/categories/${editingCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCatName.trim(), type: editCatType }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update")
      }
      const updated = await res.json()
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
      setEditingCat(null)
      toast.success("Kategori diperbarui")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui kategori")
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Hapus kategori "${name}"?`)) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409) {
          toast.error("Tidak dapat menghapus kategori yang memiliki produk")
          return
        }
        throw new Error(err.error || "Failed to delete")
      }
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success("Kategori dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori")
    }
  }

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat)
    setEditCatName(cat.name)
    setEditCatType(cat.type)
  }

  const handleAddUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      toast.error("Semua field harus diisi")
      return
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create")
      }
      const user = await res.json()
      setUsers((prev) => [user, ...prev])
      setShowUserModal(false)
      setUserForm({ name: "", email: "", password: "", role: "kasir" })
      toast.success("Pengguna ditambahkan")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah pengguna")
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Hapus pengguna "${name}"?`)) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409) {
          toast.error("Tidak dapat menghapus owner terakhir")
          return
        }
        throw new Error(err.error || "Failed to delete")
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast.success("Pengguna dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus pengguna")
    }
  }

  if (status === "loading" || loading) return <LoadingSkeleton />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown">Pengaturan</h1>
          <p className="text-sm text-brown-light/70 mt-1">Kelola pengaturan kafe, pembayaran, kategori, dan akun</p>
        </div>
        <button
          onClick={handleResetDefault}
          disabled={savingSettings}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-terracotta hover:text-terracotta-light border border-terracotta/30 hover:border-terracotta/60 rounded-xl transition-all disabled:opacity-50"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset Default
        </button>
      </div>

      {/* Profil Kafe */}
      <Card>
        <CardHeader icon={Cog6ToothIcon} title="Profil Kafe" subtitle="Informasi dasar kafe Anda" />
        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="cafeName">Nama Kafe</Label>
            <Input id="cafeName" value={formName} onChange={setFormName} placeholder="Forever Caffe" />
          </div>
          <div>
            <Label htmlFor="cafeLogo">Logo URL</Label>
            <Input id="cafeLogo" value={formLogo} onChange={setFormLogo} placeholder="https://example.com/logo.png" />
            {formLogo && (
              <div className="mt-2 flex items-center gap-3">
                <img src={formLogo} alt="Preview logo" className="w-10 h-10 rounded-lg object-cover border border-cream-dark" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                <span className="text-xs text-brown-light/60">Pratinjau logo</span>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="taxPercentage">Pajak (%)</Label>
            <Input id="taxPercentage" type="number" value={formTax} onChange={setFormTax} step="0.1" placeholder="0" />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-2.5 bg-brown hover:bg-brown-light text-cream font-medium rounded-xl transition-all text-sm disabled:opacity-50"
            >
              {savingSettings ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Card>

      {/* Pembayaran QRIS */}
      <Card>
        <CardHeader icon={CreditCardIcon} title="Pembayaran QRIS" subtitle="Atur gambar QRIS untuk pembayaran" />
        <div className="p-6 space-y-4">
          {settings.qrisImageUrl && (
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-cream-dark/50">
              <img
                src={settings.qrisImageUrl}
                alt="QRIS"
                className="w-28 h-28 rounded-xl object-cover border border-cream-dark shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 24 24' fill='none' stroke='%238B6914' stroke-width='1'%3E%3Crect x='3' y='3' width='7' height='7'/%3E%3Crect x='14' y='3' width='7' height='7'/%3E%3Crect x='3' y='14' width='7' height='7'/%3E%3Crect x='14' y='14' width='7' height='7'/%3E%3C/svg%3E" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brown">QRIS Saat Ini</p>
                <p className="text-xs text-brown-light/70 mt-1 truncate">{settings.qrisImageUrl}</p>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="qrisUrl">URL Gambar QRIS</Label>
            <Input id="qrisUrl" value={formQris} onChange={setFormQris} placeholder="https://example.com/qris.png" />
          </div>
          <div className="p-3 rounded-xl bg-gold/10 border border-gold/20">
            <p className="text-xs text-brown-light flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5 text-gold" />
              QRIS bersifat statis. Kasir harus mengonfirmasi pembayaran secara manual setelah pelanggan melakukan scan.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveQris}
              disabled={savingQris}
              className="px-6 py-2.5 bg-brown hover:bg-brown-light text-cream font-medium rounded-xl transition-all text-sm disabled:opacity-50"
            >
              {savingQris ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Card>

      {/* Kategori Produk */}
      <Card>
        <CardHeader icon={TagIcon} title="Kategori Produk" subtitle="Kelola kategori makanan dan minuman" />
        <div className="p-6 space-y-4">
          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-cream-dark/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-charcoal truncate">{cat.name}</span>
                    <Badge variant={cat.type as "makanan" | "minuman"}>{cat.type}</Badge>
                    {cat._count && cat._count.products > 0 && (
                      <span className="text-xs text-brown-light/60">{cat._count.products} produk</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditCategory(cat)} className="p-1.5 rounded-lg hover:bg-cream-dark/50 transition-colors">
                      <PencilSquareIcon className="w-4 h-4 text-brown-light" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <TrashIcon className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brown-light/60 text-center py-4">Belum ada kategori</p>
          )}

          <div className="border-t border-cream-dark/50 pt-4">
            <h4 className="text-sm font-medium text-brown mb-3">Tambah Kategori</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label>Nama</Label>
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nama kategori"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white text-charcoal placeholder:text-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all text-sm"
                />
              </div>
              <div className="w-36">
                <Label>Tipe</Label>
                <Select
                  value={newCatType}
                  onChange={setNewCatType}
                  options={[
                    { value: "makanan", label: "Makanan" },
                    { value: "minuman", label: "Minuman" },
                  ]}
                />
              </div>
              <button
                onClick={handleAddCategory}
                className="flex items-center gap-2 px-4 py-2.5 bg-brown hover:bg-brown-light text-cream font-medium rounded-xl transition-all text-sm whitespace-nowrap"
              >
                <PlusIcon className="w-4 h-4" />
                Tambah
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Akun Pengguna */}
      <Card>
        <CardHeader icon={UserGroupIcon} title="Akun Pengguna" subtitle="Kelola kasir dan pemilik" />
        <div className="p-6 space-y-4">
          {users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-cream-dark/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brown/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-brown">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{user.name}</p>
                      <p className="text-xs text-brown-light/60 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={user.role as "owner" | "kasir"}>{user.role}</Badge>
                    {user.role !== "owner" && (
                      <button onClick={() => handleDeleteUser(user.id, user.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <TrashIcon className="w-4 h-4 text-danger" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brown-light/60 text-center py-4">Belum ada pengguna</p>
          )}

          <div className="border-t border-cream-dark/50 pt-4">
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brown hover:bg-brown-light text-cream font-medium rounded-xl transition-all text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Kasir
            </button>
          </div>
        </div>
      </Card>

      {/* Edit Category Modal */}
      <Modal open={!!editingCat} onClose={() => setEditingCat(null)} title="Edit Kategori">
        <div className="space-y-4">
          <div>
            <Label>Nama Kategori</Label>
            <Input value={editCatName} onChange={setEditCatName} placeholder="Nama kategori" />
          </div>
          <div>
            <Label>Tipe</Label>
            <Select
              value={editCatType}
              onChange={setEditCatType}
              options={[
                { value: "makanan", label: "Makanan" },
                { value: "minuman", label: "Minuman" },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditingCat(null)} className="px-4 py-2.5 text-sm font-medium text-brown-light hover:text-brown transition-colors">
              Batal
            </button>
            <button onClick={handleEditCategory} className="px-6 py-2.5 bg-brown hover:bg-brown-light text-cream font-medium rounded-xl transition-all text-sm">
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Tambah Kasir">
        <div className="space-y-4">
          <div>
            <Label>Nama</Label>
            <Input value={userForm.name} onChange={(v) => setUserForm((p) => ({ ...p, name: v }))} placeholder="Nama kasir" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={userForm.email} onChange={(v) => setUserForm((p) => ({ ...p, email: v }))} placeholder="email@example.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={userForm.password} onChange={(v) => setUserForm((p) => ({ ...p, password: v }))} placeholder="Password" />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={userForm.role}
              onChange={(v) => setUserForm((p) => ({ ...p, role: v }))}
              options={[
                { value: "kasir", label: "Kasir" },
                { value: "owner", label: "Owner" },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowUserModal(false)} className="px-4 py-2.5 text-sm font-medium text-brown-light hover:text-brown transition-colors">
              Batal
            </button>
            <button onClick={handleAddUser} className="px-6 py-2.5 bg-brown hover:bg-brown-light text-cream font-medium rounded-xl transition-all text-sm">
              Tambah
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
