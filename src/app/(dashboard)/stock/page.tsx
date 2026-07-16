"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import {
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import { formatCurrency, formatDate, getStockStatus } from "@/lib/utils"

interface Product {
  id: string
  name: string
  stockQty: number
  minStockAlert: number
  category: { id: string; name: string }
}

interface StockLog {
  id: string
  productId: string
  changeQty: number
  type: "in" | "out" | "sale"
  reason: string | null
  createdBy: string
  createdAt: string
  product: { id: string; name: string }
  user: { id: string; name: string }
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemAnim = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

const typeConfig: Record<
  string,
  { label: string; icon: typeof ArrowDownIcon; color: string; bg: string }
> = {
  in: {
    label: "Masuk",
    icon: ArrowDownIcon,
    color: "text-success",
    bg: "bg-success/10",
  },
  out: {
    label: "Keluar",
    icon: ArrowUpIcon,
    color: "text-terracotta",
    bg: "bg-terracotta/10",
  },
  sale: {
    label: "Penjualan",
    icon: ArrowUpIcon,
    color: "text-gold",
    bg: "bg-gold/10",
  },
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<"in" | "out">("in")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [changeQty, setChangeQty] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, logRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/stock/logs"),
      ])
      if (prodRes.ok) setProducts(await prodRes.json())
      if (logRes.ok) setLogs(await logRes.json())
    } catch {
      toast.error("Gagal memuat data stok")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const lowStockProducts = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.minStockAlert
  )

  function openAdjust(type: "in" | "out", productId?: string) {
    setAdjustType(type)
    setSelectedProductId(productId ?? "")
    setChangeQty("")
    setReason("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProductId) {
      toast.error("Pilih produk")
      return
    }
    const qty = parseInt(changeQty)
    if (!qty || qty <= 0) {
      toast.error("Jumlah harus lebih dari 0")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/stock/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          changeQty: qty,
          type: adjustType,
          reason: reason || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal")
      }

      toast.success(
        adjustType === "in" ? "Stok berhasil ditambahkan" : "Stok berhasil dikurangi"
      )
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown">Manajemen Stok</h1>
          <p className="text-sm text-brown-light mt-1">
            Pantau dan kelola stok produk
          </p>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 text-warning mb-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-semibold text-sm">Stok Menipis</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-lg text-xs font-medium text-charcoal border border-cream-dark"
              >
                {p.name}
                <span className="text-warning font-semibold ml-1">
                  {p.stockQty}/{p.minStockAlert}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
        <div className="p-5 border-b border-cream-dark">
          <h2 className="text-lg font-semibold text-brown">Daftar Stok Produk</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50">
                <th className="text-left px-5 py-3 font-medium text-brown-light">
                  Produk
                </th>
                <th className="text-center px-5 py-3 font-medium text-brown-light">
                  Stok Saat Ini
                </th>
                <th className="text-center px-5 py-3 font-medium text-brown-light">
                  Min. Alert
                </th>
                <th className="text-center px-5 py-3 font-medium text-brown-light">
                  Status
                </th>
                <th className="text-right px-5 py-3 font-medium text-brown-light">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-cream-dark/50">
                      <td className="px-5 py-4" colSpan={5}>
                        <div className="h-5 bg-cream-dark rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                : products.map((product, idx) => {
                    const status = getStockStatus(
                      product.stockQty,
                      product.minStockAlert
                    )
                    const isLow =
                      product.stockQty > 0 &&
                      product.stockQty <= product.minStockAlert
                    return (
                      <motion.tr
                        key={product.id}
                        variants={itemAnim}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: idx * 0.02 }}
                        className={`border-t border-cream-dark/50 hover:bg-cream/30 transition-colors ${
                          isLow ? "bg-warning/5" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-charcoal">
                                {product.name}
                              </p>
                              <p className="text-xs text-brown-light/60">
                                {product.category?.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`font-semibold text-lg ${
                              isLow
                                ? "text-warning"
                                : product.stockQty === 0
                                  ? "text-danger"
                                  : "text-charcoal"
                            }`}
                          >
                            {product.stockQty}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center text-brown-light text-sm">
                          {product.minStockAlert}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAdjust("in", product.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors text-xs font-medium"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              Tambah
                            </button>
                            <button
                              onClick={() => openAdjust("out", product.id)}
                              disabled={product.stockQty <= 0}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta/10 text-terracotta hover:bg-terracotta/20 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <MinusIcon className="w-3.5 h-3.5" />
                              Kurangi
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
              {!loading && products.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-brown-light"
                  >
                    Belum ada produk
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
        <div className="p-5 border-b border-cream-dark">
          <h2 className="text-lg font-semibold text-brown">
            Riwayat Mutasi Stok
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50">
                <th className="text-left px-5 py-3 font-medium text-brown-light">
                  Tanggal
                </th>
                <th className="text-left px-5 py-3 font-medium text-brown-light">
                  Produk
                </th>
                <th className="text-center px-5 py-3 font-medium text-brown-light">
                  Tipe
                </th>
                <th className="text-center px-5 py-3 font-medium text-brown-light">
                  Jumlah
                </th>
                <th className="text-left px-5 py-3 font-medium text-brown-light">
                  Alasan
                </th>
                <th className="text-left px-5 py-3 font-medium text-brown-light">
                  User
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-cream-dark/50">
                      <td className="px-5 py-4" colSpan={6}>
                        <div className="h-5 bg-cream-dark rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                : logs.map((log, idx) => {
                    const cfg = typeConfig[log.type] || typeConfig.out
                    const Icon = cfg.icon
                    return (
                      <motion.tr
                        key={log.id}
                        variants={itemAnim}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: idx * 0.02 }}
                        className="border-t border-cream-dark/50 hover:bg-cream/30 transition-colors"
                      >
                        <td className="px-5 py-4 text-brown-light whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-5 py-4 font-medium text-charcoal">
                          {log.product.name}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`font-semibold ${
                              log.type === "in"
                                ? "text-success"
                                : "text-terracotta"
                            }`}
                          >
                            {log.type === "in" ? "+" : "-"}
                            {log.changeQty}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-brown-light text-sm">
                          {log.reason || "-"}
                        </td>
                        <td className="px-5 py-4 text-brown-light text-sm">
                          {log.user.name}
                        </td>
                      </motion.tr>
                    )
                  })}
              {!loading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-brown-light"
                  >
                    Belum ada mutasi stok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 bg-white rounded-2xl shadow-xl border border-cream-dark overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-cream-dark">
                <h2 className="text-lg font-semibold text-brown">
                  {adjustType === "in" ? "Tambah Stok" : "Kurangi Stok"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-cream-dark transition-colors text-brown-light"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Produk *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                    required
                  >
                    <option value="">Pilih produk</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stok: {p.stockQty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Tipe
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType("in")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        adjustType === "in"
                          ? "bg-success text-white shadow-sm"
                          : "bg-off-white text-brown-light border border-cream-dark"
                      }`}
                    >
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Masuk
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType("out")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        adjustType === "out"
                          ? "bg-terracotta text-white shadow-sm"
                          : "bg-off-white text-brown-light border border-cream-dark"
                      }`}
                    >
                      <MinusIcon className="w-4 h-4 inline mr-1" />
                      Keluar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Jumlah *
                  </label>
                  <input
                    type="number"
                    value={changeQty}
                    onChange={(e) => setChangeQty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                    placeholder="Masukkan jumlah"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Alasan
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-dark bg-off-white text-charcoal placeholder:text-brown-light/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all text-sm"
                    placeholder="Misal: restock dari supplier"
                  />
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
                    className="flex-1 py-2.5 rounded-xl bg-brown text-white font-medium hover:bg-brown-light transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
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
