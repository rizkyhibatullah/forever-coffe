import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface TransactionItemInput {
  productId: string
  qty: number
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        items: {
          include: { product: true },
        },
        cashier: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(transactions)
  } catch (error) {
    return Response.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items, paymentMethod, discount = 0 } = body as {
      items: TransactionItemInput[]
      paymentMethod: string
      discount?: number
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Items are required" }, { status: 400 })
    }

    if (!paymentMethod) {
      return Response.json({ error: "Payment method is required" }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: TransactionItemInput) => i.productId) }, isActive: true },
    })

    const productMap = new Map<string, { id: string; stockQty: number; name: string; price: number }>(
      products.map((p: any) => [p.id, p as { id: string; stockQty: number; name: string; price: number }])
    )

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return Response.json(
          { error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        )
      }
      if (product.stockQty < item.qty) {
        return Response.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        )
      }
    }

    const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const subtotal = items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!
      return sum + product.price * item.qty
    }, 0)

    const total = subtotal - discount

    const transaction = await prisma.$transaction(async (tx: any) => {
      const trx = await tx.transaction.create({
        data: {
          invoiceNo,
          cashierId: session.user.id,
          paymentMethod,
          subtotal,
          discount,
          total,
          status: "paid",
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!
              return {
                productId: item.productId,
                qty: item.qty,
                priceAtSale: product.price,
                subtotal: product.price * item.qty,
              }
            }),
          },
        },
        include: {
          items: { include: { product: true } },
          cashier: { select: { id: true, name: true, email: true } },
        },
      })

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.qty } },
        })

        await tx.stockLog.create({
          data: {
            productId: item.productId,
            changeQty: -item.qty,
            type: "sale",
            reason: `Sale ${invoiceNo}`,
            createdBy: session.user.id,
          },
        })
      }

      return trx
    })

    return Response.json(transaction, { status: 201 })
  } catch (error) {
    return Response.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
