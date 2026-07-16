import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logs = await prisma.stockLog.findMany({
      include: {
        product: { select: { id: true, name: true, price: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(logs)
  } catch (error) {
    return Response.json({ error: "Failed to fetch stock logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, changeQty, type, reason } = body

    if (!productId || changeQty === undefined || !type) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["in", "out"].includes(type)) {
      return Response.json(
        { error: "Type must be 'in' or 'out'" },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const qty = type === "out" ? -Math.abs(changeQty) : Math.abs(changeQty)

    if (type === "out" && product.stockQty + qty < 0) {
      return Response.json(
        { error: "Insufficient stock" },
        { status: 400 }
      )
    }

    const [log] = await prisma.$transaction([
      prisma.stockLog.create({
        data: {
          productId,
          changeQty: qty,
          type,
          reason: reason || null,
          createdBy: session.user.id,
        },
        include: {
          product: { select: { id: true, name: true, price: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stockQty: { increment: qty } },
      }),
    ])

    return Response.json(log, { status: 201 })
  } catch (error) {
    return Response.json({ error: "Failed to create stock log" }, { status: 500 })
  }
}
