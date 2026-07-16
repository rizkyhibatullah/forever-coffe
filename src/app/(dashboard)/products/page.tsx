"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { formatCurrency, getStockStatus } from "@/lib/utils"

interface Category {
  id: string
  name: string
  type: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  costPrice: number
  imageUrl: string | null
  categoryId: string
  stockQty: number
  minStockAlert: number
  isActive: boolean
  createdAt: string
  category: Category
}

interface ProductFormData {
  name: string
  description: string
  price: string
  costPrice: string
  imageUrl: string
  categoryId: string
  stockQty: string
  minStockAlert: string
}

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  imageUrl: "",
  categoryId: "",
  stockQty: "0",
  minStockAlert: "5",
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const categoryColors: Record<string, string> = {
  makanan: "from-terracotta to-terracotta-light",
  minuman: "from-gold to-amber-400",
  default: "from-brown-light to-brown",
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProducts(data)
    } catch {
      toast.error("Gagal memuat produk")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error()
      setCategories(await res.json())
    } catch {
      toast.error("Gagal memuat kategori")
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      activeCategory === "all" || p.categoryId === activeCategory
    return matchSearch && matchCategory
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      imageUrl: product.imageUrl ?? "",
      categoryId: product.categoryId,
      stockQty: product.stockQty.toString(),
      minStockAlert: product.minStockAlert.toString(),
    })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Nama, harga, dan kategori harus diisi")
      return
    }

    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice) || 0,
      imageUrl: form.imageUrl || undefined,
      categoryId: form.categoryId,
      stockQty: parseInt(form.stockQty) || 0,
      minStockAlert: parseInt(form.minStockAlert) || 5,
    }

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()

      toast.success(editingId ? "Produk diperbarui" : "Produk ditambahkan")
      setModalOpen(false)
      fetchProducts()
    } catch {
      toast.error("Gagal menyimpan produk")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Produk dihapus")
      fetchProducts()
    } catch {
      toast.error("Gagal menghapus produk")
    }
  }

  function getGradient(product: Product) {
    const key = product.category?.type || "default"
    return categoryColors[key] || categoryColors.default
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown">Produk</h1>
          <p className="text-sm text-brown-light mt-1">
            Kelola menu dan produk Forever Caffe
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta-light transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Produk
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === "all"
                ? "bg-brown text-cream shadow-sm"
                : "bg-white text-brown-light border border-cream-dark hover:border-brown-light/30"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-brown text-cream shadow-sm"
                  : "bg-white text-brown-light border border-cream-dark hover:border-brown-light/30"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark bg-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-cream-dark overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-cream-dark" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-cream-dark rounded w-3/4" />
                <div className="h-3 bg-cream-dark rounded w-1/2" />
                <div className="h-3 bg-cream-dark rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-brown-light text-lg">Belum ada produk</p>
          <p className="text-brown-light/60 text-sm mt-1">
            Tambahkan produk baru untuk memulai
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => {
              const status = getStockStatus(product.stockQty, product.minStockAlert)
              return (
                <motion.div
                  key={product.id}
                  layout
                  variants={itemAnim}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl border border-cream-dark overflow-hidden group cursor-pointer hover:shadow-lg hover:border-terracotta/20 transition-all"
                  onClick={() => openEdit(product)}
                >
                  <div
                    className={`h-40 bg-gradient-to-br ${getGradient(
                      product
                    )} flex items-center justify-center relative`}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl font-bold text-white/80 font-serif">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(product)
                        }}
                        className="p-1.5 bg-white/90 rounded-lg text-brown hover:bg-white transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(product.id, product.name)
                        }}
                        className="p-1.5 bg-white/90 rounded-lg text-danger hover:bg-white transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-charcoal text-sm leading-tight line-clamp-1">
                        {product.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-brown-light/70 line-clamp-1">
                      {product.category?.name}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-sm font-semibold text-terracotta">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-xs text-brown-light/50">
                          HPP: {formatCurrency(product.costPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-charcoal">
                          {product.stockQty}
                        </p>
                        <p className="text-xs text-brown-light/50">stok</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 bg-white rounded-2xl shadow-xl border border-cream-dark overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-cream-dark">
                <h2 className="text-lg font-semibold text-brown">
                  {editingId ? "Edit Produk" : "Tambah Produk"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-cream-dark transition-colors text-brown-light"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-brown mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                      placeholder="Masukkan nama produk"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-brown mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm resize-none"
                      rows={3}
                      placeholder="Deskripsi produk (opsional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Harga Jual (Rp) *
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      HPP (Rp)
                    </label>
                    <input
                      type="number"
                      value={form.costPrice}
                      onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-brown mb-1">
                      URL Gambar
                    </label>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                      placeholder="https://... (opsional)"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-brown mb-1">
                      Kategori *
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                      required
                    >
                      <option value="">Pilih kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      value={form.stockQty}
                      onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Min. Stok Alert
                    </label>
                    <input
                      type="number"
                      value={form.minStockAlert}
                      onChange={(e) =>
                        setForm({ ...form, minStockAlert: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-cream-dark text-brown font-medium hover:bg-cream-dark transition-colors text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-light transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? "Menyimpan..." : editingId ? "Simpan" : "Tambah"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
