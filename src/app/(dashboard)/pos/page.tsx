"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MagnifyingGlassIcon, XMarkIcon, BellIcon, ClockIcon } from "@heroicons/react/24/outline"
import { useCartStore } from "@/lib/store"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import toast from "react-hot-toast"
import PaymentModal from "@/components/pos/PaymentModal"

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

interface OrderItem {
  id: string
  productId: string
  qty: number
  priceAtOrder: number
  subtotal: number
  product: { name: string; imageUrl: string | null }
}

interface Order {
  id: string
  customerName: string
  tableNumber: number | null
  notes: string | null
  status: "pending" | "confirmed" | "done"
  paymentMethod: "counter" | "qris"
  createdAt: string
  items: OrderItem[]
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Baru saja"
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = "sine"
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch {
    /* silent */
  }
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [showOrdersPanel, setShowOrdersPanel] = useState(false)
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set())

  const { items, addItem, removeItem, updateQty, subtotal, totalItems, clearCart } = useCartStore()

  const prevPendingIds = useRef<Set<string>>(new Set())
  const prevConfirmedIds = useRef<Set<string>>(new Set())
  const isFirstFetch = useRef(true)
  const processingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ])
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data)
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data)
        }
      } catch {
        toast.error("Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders")
        if (!res.ok) return
        const data: Order[] = await res.json()
        const currentPending = new Set(data.filter((o) => o.status === "pending").map((o) => o.id))
        const currentConfirmed = new Set(data.filter((o) => o.status === "confirmed").map((o) => o.id))

        if (!isFirstFetch.current) {
          let newOrder = false
          for (const id of currentPending) {
            if (!prevPendingIds.current.has(id)) {
              playNotificationSound()
              toast.success("Pesanan baru masuk!", { duration: 3000 })
              newOrder = true
            }
          }
          for (const id of currentConfirmed) {
            if (!prevConfirmedIds.current.has(id)) {
              playNotificationSound()
              toast.success("Pesanan QRIS baru!", { duration: 3000 })
              newOrder = true
            }
          }
          if (newOrder) setShowOrdersPanel(true)
        } else {
          isFirstFetch.current = false
        }

        prevPendingIds.current = currentPending
        prevConfirmedIds.current = currentConfirmed

        setOrders((prev) => {
          const processing = processingRef.current
          if (processing.size === 0) return data

          return data.map((incoming) =>
            processing.has(incoming.id) ? prev.find((p) => p.id === incoming.id) || incoming : incoming,
          )
        })
      } catch {
        /* silent */
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders])
  const confirmedOrders = useMemo(() => orders.filter((o) => o.status === "confirmed"), [orders])

  const updateOrderStatus = useCallback(async (orderId: string, status: "confirmed" | "done") => {
    if (processingRef.current.has(orderId)) return

    processingRef.current.add(orderId)
    setProcessingOrders((prev) => {
      const next = new Set(prev)
      next.add(orderId)
      return next
    })

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated: Order = await res.json()
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
        toast.success(`Pesanan ${status === "confirmed" ? "dikonfirmasi" : "diselesaikan"}`, { duration: 2000 })
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal memperbarui pesanan")
      }
    } catch {
      toast.error("Gagal memperbarui pesanan")
    } finally {
      processingRef.current.delete(orderId)
      setProcessingOrders((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategory === "all" || p.categoryId === activeCategory
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, activeCategory, search])

  const cartSubtotal = subtotal()
  const pendingCount = pendingOrders.length
  const activeOrdersCount = pendingOrders.length + confirmedOrders.length

  return (
    <div className="flex gap-6 h-[calc(100vh-3rem)] relative">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-light/50" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark bg-white text-sm font-sans text-charcoal placeholder:text-brown-light/40 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-shadow"
            />
          </div>
          <button
            onClick={() => setShowOrdersPanel((prev) => !prev)}
            className="relative px-4 py-2.5 rounded-xl border border-cream-dark bg-white text-sm font-medium text-brown-light hover:bg-cream-dark transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <BellIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Pesanan Masuk</span>
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-red-500 text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow">
                {activeOrdersCount > 99 ? "99+" : activeOrdersCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-shrink-0 scrollbar-thin">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === "all"
                ? "bg-terracotta text-white shadow-sm"
                : "bg-white text-brown-light hover:bg-cream-dark border border-cream-dark"
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
                  ? "bg-terracotta text-white shadow-sm"
                  : "bg-white text-brown-light hover:bg-cream-dark border border-cream-dark"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-cream-dark animate-pulse"
              >
                <div className="aspect-square bg-cream-dark" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-cream-dark rounded w-3/4" />
                  <div className="h-5 bg-cream-dark rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start overflow-y-auto pr-1 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const stock = getStockStatus(product.stockQty, product.minStockAlert)
                return (
                  <motion.button
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(200,103,51,0.12)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      addItem({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                      })
                      toast.success(`${product.name} ditambahkan`, { duration: 1500 })
                    }}
                    disabled={product.stockQty <= 0}
                    className="bg-white rounded-2xl overflow-hidden border border-cream-dark text-left w-full transition-colors hover:border-terracotta/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-cream-dark"
                  >
                    <div className="aspect-square bg-cream-dark relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-brown-light/30 font-serif text-5xl">
                            {product.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${stock.color}`}
                      >
                        {stock.label}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-charcoal line-clamp-1 font-sans">
                        {product.name}
                      </p>
                      <p className="text-base font-bold text-terracotta mt-1 font-sans">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-brown-light/60">
                <MagnifyingGlassIcon className="w-12 h-12 mb-3" />
                <p className="font-sans text-sm">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showOrdersPanel ? (
        <div className="hidden md:flex w-96 flex-col bg-white rounded-2xl border border-cream-dark overflow-hidden flex-shrink-0">
          <OrdersPanelContent
            pendingOrders={pendingOrders}
            confirmedOrders={confirmedOrders}
            onClose={() => setShowOrdersPanel(false)}
            onUpdateStatus={updateOrderStatus}
            processingOrders={processingOrders}
          />
        </div>
      ) : (
        <div className="hidden md:flex w-96 flex-col bg-white rounded-2xl border border-cream-dark overflow-hidden flex-shrink-0">
          <div className="px-5 py-4 border-b border-cream-dark bg-cream">
            <h2 className="font-serif font-semibold text-lg text-brown flex items-center gap-2">
              Keranjang
              {totalItems() > 0 && (
                <span className="text-xs font-sans font-medium bg-terracotta text-white px-2 py-0.5 rounded-full">
                  {totalItems()}
                </span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-brown-light/50 py-12">
                <ShoppingCartIcon className="w-12 h-12 mb-3" />
                <p className="font-sans text-sm text-center">
                  Belum ada pesanan
                </p>
                <p className="font-sans text-xs text-center mt-1">
                  Klik produk untuk menambahkan
                </p>
              </div>
            ) : (
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
                        <span className="text-brown-light/30 font-serif font-bold text-lg">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal font-sans truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-brown-light font-sans mt-0.5">
                        {formatCurrency(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQty(item.productId, item.qty - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-cream-dark flex items-center justify-center text-brown-light hover:bg-cream-dark transition-colors text-sm font-medium"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium text-charcoal w-6 text-center font-sans">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, item.qty + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-cream-dark flex items-center justify-center text-brown-light hover:bg-cream-dark transition-colors text-sm font-medium"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-charcoal font-sans">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                      <button
                        onClick={() => {
                          removeItem(item.productId)
                          toast.success(`${item.name} dihapus`, { duration: 1500 })
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-brown-light/50 hover:text-danger text-xs"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="border-t border-cream-dark p-4 space-y-3 bg-cream/30">
            <div className="flex justify-between items-center text-sm">
              <span className="font-sans text-brown-light">Subtotal</span>
              <span className="font-sans font-semibold text-charcoal">
                {formatCurrency(cartSubtotal)}
              </span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              disabled={items.length === 0}
              className="w-full py-3 rounded-xl bg-terracotta text-white font-medium font-sans text-sm hover:bg-terracotta-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Bayar - {formatCurrency(cartSubtotal)}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showOrdersPanel && (
          <motion.div
            key="mobile-orders-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowOrdersPanel(false)}
          >
            <motion.div
              key="mobile-orders-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl overflow-hidden"
            >
              <div className="flex items-center justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
                <div className="w-10 h-1 rounded-full bg-brown-light/30" />
              </div>
              <OrdersPanelContent
                pendingOrders={pendingOrders}
                confirmedOrders={confirmedOrders}
                onClose={() => setShowOrdersPanel(false)}
                onUpdateStatus={updateOrderStatus}
                processingOrders={processingOrders}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPayment && (
        <PaymentModal
          subtotal={cartSubtotal}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false)
            clearCart()
          }}
        />
      )}
    </div>
  )
}

function OrdersPanelContent({
  pendingOrders,
  confirmedOrders,
  onClose,
  onUpdateStatus,
  processingOrders,
}: {
  pendingOrders: Order[]
  confirmedOrders: Order[]
  onClose: () => void
  onUpdateStatus: (orderId: string, status: "confirmed" | "done") => void
  processingOrders: Set<string>
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-cream-dark bg-cream flex items-center justify-between flex-shrink-0">
        <h2 className="font-serif font-semibold text-lg text-brown">Pesanan Masuk</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-cream-dark transition-colors text-brown-light"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {pendingOrders.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-brown-light uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Baru ({pendingOrders.length})
            </h3>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  type="pending"
                  onUpdateStatus={onUpdateStatus}
                  isProcessing={processingOrders.has(order.id)}
                />
              ))}
            </div>
          </section>
        )}

        {confirmedOrders.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-brown-light uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Dikonfirmasi ({confirmedOrders.length})
            </h3>
            <div className="space-y-3">
              {confirmedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  type="confirmed"
                  onUpdateStatus={onUpdateStatus}
                  isProcessing={processingOrders.has(order.id)}
                />
              ))}
            </div>
          </section>
        )}

        {pendingOrders.length === 0 && confirmedOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-brown-light/50 py-16">
            <BellIcon className="w-12 h-12 mb-3" />
            <p className="text-sm">Tidak ada pesanan</p>
            <p className="text-xs text-center mt-1">Pesanan dari pelanggan akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({
  order,
  type,
  onUpdateStatus,
  isProcessing,
}: {
  order: Order
  type: "pending" | "confirmed"
  onUpdateStatus: (orderId: string, status: "confirmed" | "done") => void
  isProcessing: boolean
}) {
  const total = order.items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="bg-cream/50 rounded-xl border border-cream-dark p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-charcoal text-sm truncate">{order.customerName}</p>
            {order.paymentMethod === "qris" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-medium shrink-0">QRIS</span>
            )}
          </div>
          {order.tableNumber && (
            <p className="text-xs text-brown-light mt-0.5">Meja {order.tableNumber}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-brown-light/60 text-xs whitespace-nowrap flex-shrink-0">
          <ClockIcon className="w-3.5 h-3.5" />
          {getTimeAgo(order.createdAt)}
        </div>
      </div>

      <div className="space-y-1.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs gap-2">
            <span className="text-charcoal truncate">
              {item.qty}x {item.product.name}
            </span>
            <span className="text-brown-light flex-shrink-0">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-cream-dark text-sm">
        <span className="text-brown-light">Total</span>
        <span className="font-bold text-charcoal">{formatCurrency(total)}</span>
      </div>

      {order.notes && (
        <div className="bg-white/60 rounded-lg px-3 py-2 text-xs text-brown-light italic leading-relaxed">
          &ldquo;{order.notes}&rdquo;
        </div>
      )}

      {type === "pending" && (
        <button
          onClick={() => onUpdateStatus(order.id, "confirmed")}
          disabled={isProcessing}
          className="w-full py-2.5 rounded-xl bg-terracotta text-white text-sm font-medium hover:bg-terracotta-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Memproses..." : "Konfirmasi"}
        </button>
      )}
      {type === "confirmed" && (
        <button
          onClick={() => onUpdateStatus(order.id, "done")}
          disabled={isProcessing}
          className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Memproses..." : "Selesai"}
        </button>
      )}
    </div>
  )
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  )
}
