"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  name: string
  price: number
  qty: number
  imageUrl?: string | null
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "qty">) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  subtotal: () => number
  totalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, qty: 1 }] })
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },
      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, qty } : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.qty, 0),
      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.qty, 0),
    }),
    { name: "forever-cafe-cart" }
  )
)
