import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["confirmed", "done"].includes(status)) {
      return Response.json({ error: "Status tidak valid" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, price: true, stockQty: true, costPrice: true } } },
        },
      },
    })

    if (!order) {
      return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
    }

    if (status === "confirmed" && order.status !== "pending") {
      return Response.json({ error: "Pesanan sudah dikonfirmasi" }, { status: 400 })
    }

    if (status === "done" && order.status !== "confirmed") {
      return Response.json({ error: "Pesanan harus dikonfirmasi terlebih dahulu" }, { status: 400 })
    }

    if (status === "done") {
      const session = await auth()
      if (!session?.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
      }

      const invoiceNo = `FC-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}${new Date().getDate().toString().padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      const subtotal = order.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0)
      const isPrepaid = order.paymentMethod === "qris"

      const updated = await prisma.$transaction(async (tx: any) => {
        await tx.order.update({
          where: { id },
          data: { status: "done" },
        })

        await tx.transaction.create({
          data: {
            invoiceNo,
            cashierId: session.user.id,
            paymentMethod: isPrepaid ? "qris" : "cash",
            subtotal,
            discount: 0,
            total: subtotal,
            status: "paid",
            items: {
              create: order.items.map((item: any) => ({
                productId: item.productId,
                qty: item.qty,
                priceAtSale: Number(item.priceAtOrder),
                subtotal: Number(item.subtotal),
              })),
            },
          },
          include: { items: { include: { product: true } } },
        })

        for (const item of order.items) {
          if (!isPrepaid) {
            if ((item.product as any).stockQty < item.qty) {
              throw new Error(`Stok ${(item.product as any).name} tidak mencukupi`)
            }

            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { decrement: item.qty } },
            })
          }

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              changeQty: -item.qty,
              type: "sale",
              reason: `Order ${invoiceNo}`,
              createdBy: session.user.id,
            },
          })
        }

        return await tx.order.findUnique({
          where: { id },
          include: { items: { include: { product: true } } },
        })
      })

      return Response.json(updated)
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } } },
    })

    return Response.json(updated)
  } catch (e: any) {
    const message = e instanceof Error ? e.message : "Gagal memperbarui pesanan"
    return Response.json({ error: message }, { status: 500 })
  }
}
