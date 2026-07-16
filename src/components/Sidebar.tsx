"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  ShoppingCartIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  TagIcon,
} from "@heroicons/react/24/outline"
import { useCartStore } from "@/lib/store"

const navItems = [
  { href: "/pos", label: "POS / Kasir", icon: ShoppingCartIcon, roles: ["owner", "kasir"] },
  { href: "/categories", label: "Kategori", icon: TagIcon, roles: ["owner"] },
  { href: "/products", label: "Produk", icon: CubeIcon, roles: ["owner"] },
  { href: "/stock", label: "Stok", icon: Squares2X2Icon, roles: ["owner", "kasir"] },
  { href: "/transactions", label: "Transaksi", icon: ClipboardDocumentListIcon, roles: ["owner", "kasir"] },
  { href: "/dashboard", label: "Dashboard", icon: ChartBarIcon, roles: ["owner"] },
  { href: "/settings", label: "Pengaturan", icon: Cog6ToothIcon, roles: ["owner"] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const totalItems = useCartStore((s) => s.totalItems())

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <aside className="w-64 bg-brown min-h-screen flex flex-col">
      <div className="p-6 border-b border-brown-light/20">
        <Link href="/pos" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
            <span className="text-brown font-serif font-bold text-lg">FC</span>
          </div>
          <div>
            <h1 className="text-cream font-serif font-semibold text-lg leading-tight">Forever</h1>
            <p className="text-cream-dark text-xs">Caffe</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              pathname === item.href
                ? "bg-gold/20 text-gold"
                : "text-cream/70 hover:text-cream hover:bg-cream/10"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
            {item.href === "/pos" && totalItems > 0 && (
              <span className="ml-auto bg-terracotta text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-brown-light/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/70 hover:text-cream hover:bg-cream/10 w-full transition-all"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
