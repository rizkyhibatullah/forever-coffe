import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    })
    return Response.json(orders)
  } catch {
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerName, tableNumber, notes, items } = body

    if (!customerName || !items || !items.length) {
      return Response.json({ error: "Nama dan pesanan harus diisi" }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: any) => i.productId) }, isActive: true },
    })
    const productMap = new Map(products.map((p: any) => [p.id, p as any]))

    for (const item of items) {
      if (!productMap.has(item.productId)) {
        return Response.json({ error: `Produk ${item.productId} tidak ditemukan` }, { status: 400 })
      }
    }

    const orderItems = items.map((item: any) => {
      const product = productMap.get(item.productId)
      return {
        productId: item.productId,
        qty: item.qty,
        priceAtOrder: product.price,
        subtotal: product.price * item.qty,
      }
    })

    const order = await prisma.order.create({
      data: {
        customerName,
        tableNumber: tableNumber ? Number(tableNumber) : null,
        notes: notes || null,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    })

    return Response.json(order, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    console.error("Order create error:", message)
    return Response.json({ error: "Gagal membuat pesanan", detail: process.env.NODE_ENV === "development" ? message : undefined }, { status: 500 })
  }
}
