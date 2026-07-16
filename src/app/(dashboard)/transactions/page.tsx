"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  BanknotesIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline"
import { formatCurrency, formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface TransactionItem {
  id: string
  qty: number
  priceAtSale: number
  subtotal: number
  product: { id: string; name: string }
}

interface Transaction {
  id: string
  invoiceNo: string
  paymentMethod: "cash" | "qris"
  subtotal: number
  discount: number
  total: number
  status: "pending" | "paid"
  createdAt: string
  cashier: { id: string; name: string }
  items: TransactionItem[]
}

const paymentMethods = [
  { key: "semua", label: "Semua" },
  { key: "cash", label: "Tunai" },
  { key: "qris", label: "QRIS" },
]

const paymentMethodLabels: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
}

function PaymentBadge({ method }: { method: "cash" | "qris" }) {
  const isCash = method === "cash"
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
        isCash
          ? "bg-blue-100 text-blue-700"
          : "bg-purple-100 text-purple-700"
      }`}
    >
      {isCash ? (
        <BanknotesIcon className="w-3.5 h-3.5" />
      ) : (
        <QrCodeIcon className="w-3.5 h-3.5" />
      )}
      {paymentMethodLabels[method]}
    </span>
  )
}

function StatusBadge({ status }: { status: "pending" | "paid" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
        status === "paid"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {status === "paid" ? "Lunas" : "Pending"}
    </span>
  )
}

function TransactionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-10 bg-cream-dark rounded-xl flex-1" />
        <div className="h-10 bg-cream-dark rounded-xl w-48" />
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-cream-dark/40">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-cream-dark rounded w-32" />
              <div className="h-3 bg-cream-dark rounded w-24" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 bg-cream-dark rounded w-20 ml-auto" />
              <div className="h-3 bg-cream-dark rounded w-16 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailModal({
  transaction,
  onClose,
}: {
  transaction: Transaction
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-cream-dark/40">
          <h3 className="text-lg font-semibold font-serif text-charcoal">Detail Transaksi</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-cream-dark/40 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-charcoal/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-charcoal/50">Invoice</p>
              <p className="font-semibold text-charcoal">{transaction.invoiceNo}</p>
            </div>
            <div>
              <p className="text-charcoal/50">Tanggal</p>
              <p className="font-semibold text-charcoal">{formatDate(transaction.createdAt)}</p>
            </div>
            <div>
              <p className="text-charcoal/50">Kasir</p>
              <p className="font-semibold text-charcoal">{transaction.cashier.name}</p>
            </div>
            <div>
              <p className="text-charcoal/50">Metode</p>
              <PaymentBadge method={transaction.paymentMethod} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-charcoal/50 mb-2 pb-2 border-b border-cream-dark/40">
              <span className="flex-1">Item</span>
              <span className="w-16 text-center">Qty</span>
              <span className="w-24 text-right">Harga</span>
              <span className="w-24 text-right">Subtotal</span>
            </div>
            <div className="space-y-2">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="flex-1 font-medium text-charcoal">{item.product.name}</span>
                  <span className="w-16 text-center text-charcoal/70">{item.qty}x</span>
                  <span className="w-24 text-right text-charcoal/70">{formatCurrency(item.priceAtSale)}</span>
                  <span className="w-24 text-right font-medium text-charcoal">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-cream-dark/40 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-charcoal/60">Subtotal</span>
              <span className="font-medium text-charcoal">{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/60">Diskon</span>
                <span className="font-medium text-danger">-{formatCurrency(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-1.5 border-t border-cream-dark/40">
              <span className="text-charcoal">Total</span>
              <span className="text-brown">{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-charcoal/50">Status</span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("semua")
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/transactions")
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setTransactions(json)
      } catch {
        toast.error("Gagal memuat transaksi")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = transactions.filter((t) => {
    if (paymentFilter !== "semua" && t.paymentMethod !== paymentFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.invoiceNo.toLowerCase().includes(q) ||
      t.cashier.name.toLowerCase().includes(q)
    )
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  } as const

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  } as const

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={rowVariants}>
        <h1 className="text-2xl font-bold text-charcoal">Riwayat Transaksi</h1>
        <p className="text-sm text-charcoal/60">Daftar seluruh transaksi penjualan</p>
      </motion.div>

      <motion.div
        variants={rowVariants}
        className="bg-white rounded-2xl p-4 shadow-sm border border-cream-dark/40"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            <input
              type="text"
              placeholder="Cari invoice atau kasir..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-cream/50 border border-cream-dark/60 rounded-xl text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-cream-dark/40 rounded-lg p-0.5">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.key}
                  onClick={() => setPaymentFilter(pm.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    paymentFilter === pm.key
                      ? "bg-brown text-cream shadow-sm"
                      : "text-charcoal/60 hover:text-charcoal"
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <TransactionSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div
          variants={rowVariants}
          className="text-center py-16 bg-white rounded-2xl border border-cream-dark/40"
        >
          <FunnelIcon className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
          <p className="text-charcoal/50">Tidak ada transaksi ditemukan</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((tx) => (
              <motion.div
                key={tx.id}
                layout
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                onClick={() => setSelectedTx(tx)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-cream-dark/40 hover:border-gold/30 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-charcoal">{tx.invoiceNo}</p>
                      <p className="text-xs text-charcoal/50">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-xs text-charcoal/50 min-w-[80px]">
                      {tx.cashier.name}
                    </div>
                    <div className="text-xs text-charcoal/50 min-w-[60px]">
                      {tx.items.length} item
                    </div>
                    <PaymentBadge method={tx.paymentMethod} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-charcoal">{formatCurrency(tx.total)}</p>
                    </div>
                    <StatusBadge status={tx.status} />
                    <ChevronDownIcon className="w-4 h-4 text-charcoal/30" />
                  </div>
                </div>

                <div className="sm:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-charcoal">{tx.invoiceNo}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal/60">{formatDate(tx.createdAt)}</span>
                    <PaymentBadge method={tx.paymentMethod} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-charcoal/50">{tx.cashier.name} &middot; {tx.items.length} item</span>
                    <span className="font-semibold text-charcoal">{formatCurrency(tx.total)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedTx && (
          <DetailModal
            transaction={selectedTx}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
