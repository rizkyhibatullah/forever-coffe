"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Category {
  id: string
  name: string
  type: string
  _count?: { products: number }
}

interface Product {
  id: string
  name: string
  price: number
  description?: string
  imageUrl?: string
  stockQty: number
  categoryId: string
  category?: { name: string }
}

interface MenuSectionProps {
  products: Product[]
  categories: Category[]
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
}

const fallbackItems = [
  { name: "Kopi Susu", price: 18000, emoji: "☕" },
  { name: "Americano", price: 15000, emoji: "☕" },
  { name: "Matcha Latte", price: 22000, emoji: "🍵" },
  { name: "Croissant", price: 12000, emoji: "🥐" },
  { name: "Nasi Goreng", price: 25000, emoji: "🍚" },
  { name: "French Fries", price: 15000, emoji: "🍟" },
  { name: "Milk Shake", price: 20000, emoji: "🥤" },
  { name: "Espresso", price: 12000, emoji: "☕" },
]

export default function MenuSection({ products, categories }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredProducts =
    products.length > 0
      ? activeCategory === "all"
        ? products
        : products.filter((p) => p.categoryId === activeCategory)
      : null

  const displayItems =
    filteredProducts !== null
      ? filteredProducts
      : activeCategory === "all"
        ? fallbackItems
        : fallbackItems

  const isFallback = filteredProducts === null

  return (
    <section id="menu" className="py-20 px-6 bg-cream scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-brown">Menu Kami</h2>
          <p className="text-brown-light mt-2">Nikmati pilihan makanan & minuman favoritmu</p>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 mb-10 overflow-x-auto pb-1 scrollbar-thin -mx-4 px-4 justify-center">
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
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {(displayItems as any[]).map((item: any, i: number) => (
              <motion.div
                key={isFallback ? i : item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="bg-white rounded-2xl overflow-hidden border border-cream-dark hover:shadow-lg hover:shadow-brown/5 transition-all hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{item.emoji || "☕"}</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-semibold text-brown">{item.name}</h3>
                  {item.description && (
                    <p className="text-brown-light text-xs mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-terracotta">
                      {formatPrice(typeof item.price === "number" ? item.price : parseInt(item.price))}
                    </span>
                    {item.stockQty !== undefined && item.stockQty <= 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Habis</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {products.length > 0 && filteredProducts !== null && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-brown-light/60">
            <p className="text-sm">Tidak ada produk di kategori ini</p>
          </div>
        )}
      </div>
    </section>
  )
}
