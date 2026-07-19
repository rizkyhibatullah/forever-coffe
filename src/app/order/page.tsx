"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  HomeIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"
import { useCartStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  categoryId: string
  stockQty: number
  minStockAlert: number
  isActive: boolean
  category: { id: string; name: string; type: string }
}

interface Category {
  id: string
  name: string
  type: string
}

interface OrderItemData {
  id: string
  qty: number
  priceAtOrder: number
  subtotal: number
  product: { id: string; name: string; imageUrl: string | null }
}

interface Order {
  id: string
  customerName: string
  tableNumber: number | null
  notes: string | null
  status: string
  paymentMethod?: string
  createdAt: string
  items: OrderItemData[]
}

export default function OrderPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successOrder, setSuccessOrder] = useState<Order | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"counter" | "qris">("counter")
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null)
  const [qrisConfirming, setQrisConfirming] = useState(false)

  const { items, addItem, removeItem, updateQty, subtotal, totalItems, clearCart } = useCartStore()

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes, settingsRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
          fetch("/api/settings"),
        ])
        if (productsRes.ok) setProducts(await productsRes.json())
        if (categoriesRes.ok) setCategories(await categoriesRes.json())
        if (settingsRes.ok) {
          const s = await settingsRes.json()
          setQrisImageUrl(s?.qrisImageUrl ?? null)
        }
      } catch {
        toast.error("Gagal memuat data menu")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [cartOpen])

  const filteredProducts = useMemo(
    () => products.filter((p) => activeCategory === "all" || p.categoryId === activeCategory),
    [products, activeCategory],
  )

  const cartSubtotal = subtotal()
  const itemCount = totalItems()

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (product.stockQty <= 0) {
        toast.error(`${product.name} sedang habis`)
        return
      }
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      })
      toast.success(`${product.name} ditambahkan`, { duration: 1500 })
    },
    [addItem],
  )

  const handleSubmitOrder = useCallback(async () => {
    if (!customerName.trim()) {
      toast.error("Nama pelanggan harus diisi")
      return
    }
    if (items.length === 0) {
      toast.error("Pesanan masih kosong")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          tableNumber: tableNumber ? Number.parseInt(tableNumber) : null,
          notes: notes.trim() ? notes.trim() : null,
          paymentMethod,
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Gagal membuat pesanan")
      setSuccessOrder(data)
      clearCart()
      setCartOpen(false)
      setCustomerName("")
      setTableNumber("")
      setNotes("")
      toast.success(paymentMethod === "qris" ? "Pembayaran berhasil! Pesanan dikonfirmasi." : "Pesanan berhasil dikirim!")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }, [customerName, tableNumber, notes, items, clearCart, paymentMethod])

  const handleQrisConfirm = async () => {
    setQrisConfirming(true)
    await handleSubmitOrder()
    setQrisConfirming(false)
  }

  if (successOrder) {
    return <SuccessState order={successOrder} onNewOrder={() => setSuccessOrder(null)} />
  }

  return (
    <div className="min-h-screen bg-off-white">
      <header className="sticky top-0 z-30 bg-off-white/95 backdrop-blur-md border-b border-cream-dark">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center">
              <span className="text-white font-serif font-bold text-sm">FC</span>
            </div>
            <span className="font-serif font-semibold text-brown text-lg">Forever Caffe</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-brown-light hover:text-brown hover:bg-cream transition-colors"
            >
              <HomeIcon className="w-4 h-4" />
              Beranda
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-xl hover:bg-cream transition-colors"
              aria-label="Buka keranjang"
            >
              <ShoppingBagIcon className="w-6 h-6 text-brown" />
              {hydrated && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 pb-32 md:pb-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brown">Pesan Sekarang</h1>
          <p className="text-brown-light mt-1">Pilih menu favoritmu untuk takeaway atau dine-in</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-thin -mx-4 px-4">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === "all"
                ? "bg-terracotta text-white shadow-sm shadow-terracotta/20"
                : "bg-white text-brown-light hover:bg-cream border border-cream-dark"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.id
                  ? "bg-terracotta text-white shadow-sm shadow-terracotta/20"
                  : "bg-white text-brown-light hover:bg-cream border border-cream-dark"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-cream-dark animate-pulse">
                <div className="aspect-[4/3] bg-cream-dark" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-cream-dark rounded w-3/4" />
                  <div className="h-5 bg-cream-dark rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-brown-light/60">
            <ShoppingBagIcon className="w-12 h-12 mb-3" />
            <p className="text-sm">Tidak ada produk di kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden border border-cream-dark group cursor-pointer"
                  onClick={() => handleAddToCart(product)}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-cream to-cream-dark relative overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">☕</span>
                      </div>
                    )}
                    {product.stockQty <= 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-white/90 text-brown text-xs font-medium shadow-sm">
                          Habis
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif font-semibold text-brown text-sm md:text-base">{product.name}</h3>
                    {product.description && (
                      <p className="text-brown-light text-xs mt-1 line-clamp-1">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-terracotta text-sm md:text-base">{formatCurrency(product.price)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product) }}
                        disabled={product.stockQty <= 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-terracotta text-white text-xs font-medium hover:bg-terracotta-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Tambah
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {hydrated && itemCount > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-cream-dark md:hidden z-20 shadow-lg"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="w-full py-3 rounded-xl bg-terracotta text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-terracotta-light transition-colors shadow-lg shadow-terracotta/20"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              Lihat Pesanan ({itemCount}) &bull; {formatCurrency(cartSubtotal)}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={isMobile ? { y: "100%" } : { x: "100%" }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: "100%" } : { x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed z-50 bg-white shadow-2xl flex flex-col ${
                isMobile
                  ? "bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh]"
                  : "right-0 top-0 bottom-0 w-full max-w-md rounded-l-2xl"
              }`}
            >
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-cream-dark">
                <h2 className="font-serif font-semibold text-lg text-brown flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5" />
                  Pesanan
                  {hydrated && itemCount > 0 && (
                    <span className="text-xs font-sans font-medium bg-terracotta text-white px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </h2>
                <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-cream transition-colors">
                  <XMarkIcon className="w-5 h-5 text-brown-light" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 pb-8">
                {items.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.productId}
                          initial={{ opacity: 0, x: 20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-cream/50 border border-cream-dark group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-cream-dark flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-brown-light/30 text-lg">☕</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-charcoal truncate">{item.name}</p>
                            <p className="text-xs text-brown-light mt-0.5">{formatCurrency(item.price)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQty(item.productId, item.qty - 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-cream-dark flex items-center justify-center text-brown-light hover:bg-cream-dark transition-colors"
                              >
                                <MinusIcon className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium text-charcoal w-6 text-center">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.productId, item.qty + 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-cream-dark flex items-center justify-center text-brown-light hover:bg-cream-dark transition-colors"
                              >
                                <PlusIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-semibold text-charcoal">{formatCurrency(item.price * item.qty)}</span>
                            <button
                              onClick={() => { removeItem(item.productId); toast.success(`${item.name} dihapus`, { duration: 1500 }) }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-brown-light/50 hover:text-danger"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-brown-light/50">
                    <ShoppingCartIcon className="w-12 h-12 mb-3" />
                    <p className="text-sm">Belum ada pesanan</p>
                    <p className="text-xs mt-1">Klik menu untuk menambahkan</p>
                  </div>
                ) : (
                  <div className="border-t border-cream-dark pt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-brown-light mb-1">
                        Nama Pelanggan <span className="text-terracotta">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Masukkan nama"
                        className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-white text-sm placeholder:text-brown-light/30 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-shadow"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-brown-light mb-1">No. Meja</label>
                        <input
                          type="number"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Opsional"
                          min="1"
                          className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-white text-sm placeholder:text-brown-light/30 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-shadow"
                        />
                      </div>
                      <div className="flex-shrink-0 pt-5">
                        <span className="text-[11px] text-brown-light/50">Kosongkan untuk <br />takeaway</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-brown-light mb-2">Metode Pembayaran</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentMethod("counter")}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            paymentMethod === "counter"
                              ? "border-terracotta bg-terracotta/5 text-terracotta"
                              : "border-cream-dark bg-white text-brown-light hover:border-brown-light/30"
                          }`}
                        >
                          <span className="block text-xl mb-1">🏪</span>
                          <span className="text-xs font-medium">Bayar di Kasir</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod("qris")}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            paymentMethod === "qris"
                              ? "border-terracotta bg-terracotta/5 text-terracotta"
                              : "border-cream-dark bg-white text-brown-light hover:border-brown-light/30"
                          }`}
                        >
                          <span className="block text-xl mb-1">📱</span>
                          <span className="text-xs font-medium">QRIS</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-brown-light mb-1">Catatan</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Catatan pesanan (opsional)"
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-white text-sm placeholder:text-brown-light/30 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-shadow resize-none"
                      />
                    </div>

                    {paymentMethod === "qris" && (
                      <div className="p-4 rounded-xl bg-white border border-cream-dark">
                        <p className="text-xs font-medium text-brown mb-3 text-center">Scan QRIS untuk membayar</p>
                        {qrisImageUrl ? (
                          <img src={qrisImageUrl} alt="QRIS" className="w-48 h-48 object-contain mx-auto rounded-xl" />
                        ) : (
                          <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-cream-dark flex items-center justify-center bg-cream/30">
                            <p className="text-xs text-brown-light text-center px-4">QRIS belum diatur</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-brown-light">Total</span>
                      <span className="text-lg font-bold text-brown">{formatCurrency(cartSubtotal)}</span>
                    </div>

                    {paymentMethod === "counter" ? (
                      <button
                        onClick={handleSubmitOrder}
                        disabled={submitting || items.length === 0}
                        className="w-full py-3 rounded-xl bg-terracotta text-white font-medium text-sm hover:bg-terracotta-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          "Pesan Sekarang"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleQrisConfirm}
                        disabled={submitting || qrisConfirming || items.length === 0 || !qrisImageUrl}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                      >
                        {submitting || qrisConfirming ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          "✅ Saya Sudah Bayar"
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function SuccessState({ order, onNewOrder }: { order: Order; onNewOrder: () => void }) {
  const orderTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0)
  const orderTime = new Date(order.createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-3xl border border-cream-dark p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", damping: 15 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircleIcon className="w-10 h-10 text-success" />
        </motion.div>

        <h2 className="font-serif text-2xl font-bold text-brown mb-1">Pesanan Diterima!</h2>
        <p className="text-brown-light text-sm mb-6">
          Terima kasih, {order.customerName}! Pesananmu sedang kami proses.
        </p>

        <div className="bg-cream/50 rounded-2xl p-5 mb-6 text-left">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-cream-dark">
            <span className="text-xs text-brown-light font-medium">Order ID</span>
            <span className="text-sm font-mono font-bold text-brown">#{order.id.slice(-6).toUpperCase()}</span>
          </div>

          <div className="space-y-2 mb-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-brown">
                  {item.product.name}{" "}
                  <span className="text-brown-light/60">x{item.qty}</span>
                </span>
                <span className="text-brown font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {order.tableNumber && (
            <div className="flex items-center justify-between text-sm pt-3 border-t border-cream-dark">
              <span className="text-brown-light">Meja</span>
              <span className="text-brown font-medium">{order.tableNumber}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm pt-3 border-t border-cream-dark mt-3">
            <span className="font-semibold text-brown">Total</span>
            <span className="font-bold text-terracotta text-lg">{formatCurrency(orderTotal)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-brown-light/60 mb-6">
          <span>Pukul {orderTime}</span>
          <span className="w-1 h-1 rounded-full bg-brown-light/30" />
          <span className="capitalize">
            Pembayaran: <span className="font-medium">{order.paymentMethod === "qris" ? "QRIS ✅" : "Di Kasir"}</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-brown-light/30" />
          <span className="capitalize">
            Status: <span className="font-medium text-gold">{order.status}</span>
          </span>
        </div>

        <button
          onClick={onNewOrder}
          className="w-full py-3 rounded-xl bg-terracotta text-white font-medium text-sm hover:bg-terracotta-light transition-colors shadow-sm"
        >
          Pesan Lagi
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 mt-4 text-sm text-brown-light hover:text-brown transition-colors"
        >
          <HomeIcon className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </motion.div>
    </div>
  )
}
