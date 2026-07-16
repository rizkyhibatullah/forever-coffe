export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

export function generateInvoiceNo(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const d = date.getDate().toString().padStart(2, "0")
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FC-${y}${m}${d}-${rand}`
}

export function getStockStatus(stockQty: number, minAlert: number): { label: string; color: string } {
  if (stockQty <= 0) return { label: "Habis", color: "bg-red-100 text-red-800" }
  if (stockQty <= minAlert) return { label: "Stok Menipis", color: "bg-yellow-100 text-yellow-800" }
  return { label: "Tersedia", color: "bg-green-100 text-green-800" }
}
