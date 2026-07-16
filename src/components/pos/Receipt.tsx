"use client"

import { formatCurrency, formatDate } from "@/lib/utils"
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline"

interface ReceiptItem {
  name: string
  qty: number
  price: number
  subtotal: number
}

interface ReceiptProps {
  cafeName: string
  invoiceNo: string
  date: Date
  items: ReceiptItem[]
  total: number
  method: "cash" | "qris"
  amountReceived?: number
  change?: number
  onClose: () => void
}

export default function Receipt({
  cafeName,
  invoiceNo,
  date,
  items,
  total,
  method,
  amountReceived,
  change,
  onClose,
}: ReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark print:hidden">
        <h3 className="font-serif font-semibold text-lg text-brown">Struk Pembayaran</h3>
        <button
          onClick={onClose}
          className="text-brown-light/50 hover:text-brown p-1 rounded-lg hover:bg-cream-dark transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        <div className="text-center mb-6 print:text-center">
          <h2 className="font-serif font-bold text-xl text-brown">{cafeName}</h2>
          <p className="font-sans text-xs text-brown-light mt-1">{invoiceNo}</p>
          <p className="font-sans text-xs text-brown-light">{formatDate(date)}</p>
        </div>

        <div className="border-t border-dashed border-cream-dark pt-4 space-y-2">
          <div className="flex font-sans text-xs font-semibold text-brown-light pb-1 border-b border-cream-dark">
            <span className="flex-1">Item</span>
            <span className="w-12 text-center">Qty</span>
            <span className="w-24 text-right">Subtotal</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex font-sans text-sm text-charcoal">
              <span className="flex-1 truncate">{item.name}</span>
              <span className="w-12 text-center text-brown-light">{item.qty}</span>
              <span className="w-24 text-right font-medium">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-cream-dark mt-4 pt-4 space-y-1">
          <div className="flex justify-between font-sans font-bold text-base text-charcoal">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between font-sans text-xs text-brown-light">
            <span>Pembayaran</span>
            <span className="capitalize">{method === "cash" ? "Tunai" : "QRIS"}</span>
          </div>
          {method === "cash" && amountReceived !== undefined && (
            <>
              <div className="flex justify-between font-sans text-sm text-charcoal">
                <span>Pembayaran</span>
                <span>{formatCurrency(amountReceived)}</span>
              </div>
              <div className="flex justify-between font-sans text-sm text-charcoal">
                <span>Kembalian</span>
                <span>{formatCurrency(change ?? 0)}</span>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-dashed border-cream-dark mt-6 pt-4 text-center">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brown text-cream font-sans text-sm font-medium hover:bg-brown-light transition-colors print:hidden"
          >
            <PrinterIcon className="w-4 h-4" />
            Cetak Struk
          </button>
          <p className="font-sans text-xs text-brown-light mt-3">Terima kasih telah berbelanja</p>
        </div>
      </div>
    </div>
  )
}
