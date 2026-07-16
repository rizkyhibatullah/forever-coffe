"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  FireIcon,
} from "@heroicons/react/24/outline"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface DashboardData {
  todayRevenue: number
  todayTransactions: number
  weeklyRevenue: { date: string; revenue: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
  topProducts: { productId: string; name: string; totalQty: number }[]
  lowStockProducts: { id: string; name: string; stockQty: number; minStockAlert: number }[]
  profitSummary: { totalRevenue: number; totalCost: number; totalProfit: number }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl p-5 shadow-sm border border-cream-dark/40 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-charcoal/60 font-medium">{label}</p>
        <p className="text-xl font-bold text-charcoal font-serif">{value}</p>
      </div>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cream-dark" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-cream-dark rounded w-20" />
                <div className="h-5 bg-cream-dark rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-cream-dark/40 h-72" />
        <div className="bg-white rounded-2xl p-5 border border-cream-dark/40 h-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-cream-dark/40 h-64" />
        <div className="bg-white rounded-2xl p-5 border border-cream-dark/40 h-64" />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brown text-cream px-3 py-2 rounded-xl text-sm shadow-lg">
        <p className="font-medium">{label}</p>
        <p>{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard")
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setData(json)
      } catch {
        toast.error("Gagal memuat data dashboard")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading && !data) return <DashboardSkeleton />

  const dailyChartData = data?.weeklyRevenue.map((d) => ({
    date: new Date(d.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
    revenue: d.revenue,
  }))

  const monthlyChartData = data?.monthlyRevenue.map((d) => ({
    month: new Date(d.month + "-01").toLocaleDateString("id-ID", { month: "short" }),
    revenue: d.revenue,
  }))

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
          <p className="text-sm text-charcoal/60">Rekap keuntungan dan performa bisnis</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast("Fitur export akan segera hadir")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-cream-dark/60 rounded-xl text-sm font-medium text-charcoal/70 hover:bg-cream-dark/30 transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CurrencyDollarIcon}
          label="Total Pendapatan"
          value={formatCurrency(data?.profitSummary.totalRevenue ?? 0)}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          icon={DocumentTextIcon}
          label="Total Transaksi"
          value={(data?.todayTransactions ?? 0).toString()}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={ChartBarIcon}
          label="Keuntungan Bersih"
          value={formatCurrency(data?.profitSummary.totalProfit ?? 0)}
          color="bg-gold/20 text-gold"
        />
        <StatCard
          icon={CubeIcon}
          label="Produk Terjual"
          value={(data?.topProducts.reduce((sum, p) => sum + p.totalQty, 0) ?? 0).toString()}
          color="bg-terracotta/20 text-terracotta"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-cream-dark/40">
          <h2 className="text-lg font-semibold text-charcoal font-serif mb-4">Pendapatan 7 Hari</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyChartData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#4A3728" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#4A3728" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="#C86733" strokeWidth={2} dot={{ fill: "#C86733", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-cream-dark/40">
          <h2 className="text-lg font-semibold text-charcoal font-serif mb-4">Pendapatan Bulanan</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyChartData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#4A3728" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#4A3728" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#D4A853" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-cream-dark/40">
          <div className="flex items-center gap-2 mb-4">
            <FireIcon className="w-5 h-5 text-terracotta" />
            <h2 className="text-lg font-semibold text-charcoal font-serif">Produk Terlaris</h2>
          </div>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((item, i) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 rounded-xl bg-cream/50 hover:bg-cream-dark/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-brown text-cream text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-medium text-charcoal">{item.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-charcoal">{item.totalQty} terjual</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal/50 text-sm py-8 text-center">Belum ada data penjualan</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-cream-dark/40">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-charcoal font-serif">Stok Menipis</h2>
          </div>
          {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockProducts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 hover:bg-red-100/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-charcoal">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${item.stockQty === 0 ? "text-danger" : "text-warning"}`}>
                      {item.stockQty === 0 ? "Habis" : `${item.stockQty} tersisa`}
                    </p>
                    <p className="text-xs text-charcoal/50">Min. {item.minStockAlert}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal/50 text-sm py-8 text-center">Semua stok aman</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
