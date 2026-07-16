"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useCartStore } from "@/lib/store"
import { formatCurrency, generateInvoiceNo } from "@/lib/utils"
import toast from "react-hot-toast"
import Receipt from "./Receipt"

type PaymentMethod = "cash" | "qris"

interface Setting {
  qrisImageUrl: string | null
  cafeName: string
}

interface PaymentModalProps {
  subtotal: number
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({ subtotal, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [amountReceived, setAmountReceived] = useState("")
  const [settings, setSettings] = useState<Setting | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [receipt, setReceipt] = useState<{
    invoiceNo: string
    date: Date
    items: { name: string; qty: number; price: number; subtotal: number }[]
    total: number
    method: PaymentMethod
    amountReceived?: number
    change?: number
  } | null>(null)

  const { items, clearCart } = useCartStore()

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setSettings(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const change = amountReceived ? parseFloat(amountReceived.replace(/\./g, "")) - subtotal : 0
  const isValidPayment = amountReceived && parseFloat(amountReceived.replace(/\./g, "")) >= subtotal

  const handleConfirm = async () => {
    if (loading) {
      toast.loading("Memuat...")
      return
    }

    setSubmitting(true)
    const invoiceNo = generateInvoiceNo()
    const cartItems = items.map((i) => ({
      productId: i.productId,
      qty: i.qty,
      price: i.price,
      name: i.name,
    }))

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          invoiceNo,
          paymentMethod: method,
          subtotal,
          total: subtotal,
          items: cartItems,
        }),
      })

      if (res.status === 401) {
        toast.error("Sesi habis, silakan login ulang")
        setTimeout(() => { window.location.href = "/login" }, 1500)
        return
      }

      if (!res.ok) throw new Error("Gagal memproses transaksi")

      setReceipt({
        invoiceNo,
        date: new Date(),
        items: cartItems.map((i) => ({
          name: i.name,
          qty: i.qty,
          price: i.price,
          subtotal: i.price * i.qty,
        })),
        total: subtotal,
        method,
        ...(method === "cash"
          ? {
              amountReceived: parseFloat(amountReceived.replace(/\./g, "")),
              change: parseFloat(amountReceived.replace(/\./g, "")) - subtotal,
            }
          : {}),
      })

      toast.success("Pembayaran berhasil!")
    } catch (e) {
      toast.error("Gagal memproses transaksi")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseReceipt = () => {
    setReceipt(null)
    clearCart()
    onSuccess()
    onClose()
  }

  const formatInput = (value: string) => {
    const num = value.replace(/[^0-9]/g, "")
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget && !receipt) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto" />
              <p className="text-brown-light text-sm mt-3">Memuat...</p>
            </div>
          ) : receipt ? (
            <Receipt
              cafeName={settings?.cafeName ?? "Forever Caffe"}
              invoiceNo={receipt.invoiceNo}
              date={receipt.date}
              items={receipt.items}
              total={receipt.total}
              method={receipt.method}
              amountReceived={receipt.amountReceived}
              change={receipt.change}
              onClose={handleCloseReceipt}
            />
          ) : (
            <>
              <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
                <h3 className="font-serif font-semibold text-lg text-brown">Pembayaran</h3>
                <button onClick={onClose} className="text-brown-light/50 hover:text-brown p-1 rounded-lg hover:bg-cream-dark transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between bg-cream rounded-xl px-4 py-3 border border-cream-dark">
                  <span className="font-sans text-sm text-brown-light">Total Pembayaran</span>
                  <span className="font-serif font-bold text-xl text-terracotta">{formatCurrency(subtotal)}</span>
                </div>

                <div>
                  <label className="block font-sans text-sm font-medium text-brown mb-3">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setMethod("cash")} className={`p-4 rounded-xl border-2 text-center transition-all ${method === "cash" ? "border-terracotta bg-terracotta/5 text-terracotta" : "border-cream-dark bg-white text-brown-light hover:border-brown-light/30"}`}>
                      <span className="block text-2xl mb-1">💵</span>
                      <span className="font-sans text-sm font-medium">Tunai</span>
                    </button>
                    <button onClick={() => setMethod("qris")} className={`p-4 rounded-xl border-2 text-center transition-all ${method === "qris" ? "border-terracotta bg-terracotta/5 text-terracotta" : "border-cream-dark bg-white text-brown-light hover:border-brown-light/30"}`}>
                      <span className="block text-2xl mb-1">📱</span>
                      <span className="font-sans text-sm font-medium">QRIS</span>
                    </button>
                  </div>
                </div>

                {method === "cash" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block font-sans text-sm font-medium text-brown mb-2">Jumlah Diterima</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm text-brown-light">Rp</span>
                      <input
                        type="text" inputMode="numeric" value={amountReceived}
                        onChange={(e) => setAmountReceived(formatInput(e.target.value))}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-dark bg-white text-lg font-sans font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                      />
                    </div>
                    {amountReceived && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 flex justify-between items-center p-3 rounded-xl ${change >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <span className="font-sans text-sm text-brown-light">Kembalian</span>
                        <span className={`font-sans font-semibold text-base ${change >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {change >= 0 ? formatCurrency(change) : `-${formatCurrency(Math.abs(change))}`}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {method === "qris" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                    {settings?.qrisImageUrl ? (
                      <img src={settings.qrisImageUrl} alt="QRIS" className="w-56 h-56 object-contain rounded-xl border border-cream-dark p-2 bg-white" />
                    ) : (
                      <div className="w-56 h-56 rounded-xl border-2 border-dashed border-cream-dark flex items-center justify-center bg-cream/30">
                        <p className="font-sans text-sm text-brown-light text-center px-4">QRIS belum diatur</p>
                      </div>
                    )}
                    <p className="font-sans text-xs text-brown-light mt-3 text-center">Scan QRIS di atas untuk melakukan pembayaran</p>
                  </motion.div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-cream-dark bg-cream/30 flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-cream-dark text-brown-light font-sans text-sm font-medium hover:bg-cream-dark transition-colors">Batal</button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting || (method === "cash" && !isValidPayment)}
                  className="flex-1 py-3 rounded-xl bg-terracotta text-white font-sans text-sm font-medium hover:bg-terracotta-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Memproses...</>
                  ) : method === "qris" ? "Konfirmasi Pembayaran Diterima" : "Bayar"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
