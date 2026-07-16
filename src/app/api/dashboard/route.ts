import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const [
      todayTransactions,
      todayRaw,
      weeklyRaw,
      monthlyRaw,
      topProductsRaw,
      lowStockProducts,
      allPaidTransactions,
    ] = await Promise.all([
      prisma.transaction.count({
        where: { status: "paid", createdAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.transaction.aggregate({
        where: { status: "paid", createdAt: { gte: todayStart, lt: todayEnd } },
        _sum: { total: true },
      }),
      prisma.transaction.findMany({
        where: { status: "paid", createdAt: { gte: new Date(now.getTime() - 6 * 86400000) } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.findMany({
        where: { status: "paid", createdAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transactionItem.groupBy({
        by: ["productId"],
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),
      prisma.$queryRawUnsafe<
        Array<{ id: string; name: string; stock_qty: number; min_stock_alert: number }>
      >(
        `SELECT id, name, stock_qty, min_stock_alert FROM products WHERE is_active = true AND stock_qty <= min_stock_alert`
      ),
      prisma.transaction.findMany({
        where: { status: "paid" },
        select: {
          items: {
            select: {
              qty: true,
              priceAtSale: true,
              product: { select: { costPrice: true } },
            },
          },
        },
      }),
    ])

    const todayRevenue = todayRaw._sum.total ?? 0

    const weeklyRevenue: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const dayTotal = weeklyRaw
        .filter((t: { createdAt: Date; total: number }) => t.createdAt.toISOString().slice(0, 10) === dateStr)
        .reduce((sum: number, t: { total: number }) => sum + t.total, 0)
      weeklyRevenue.push({ date: dateStr, revenue: dayTotal })
    }

    const monthlyMap = new Map<string, number>()
    for (const t of monthlyRaw) {
      const key = t.createdAt.toISOString().slice(0, 7)
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + t.total)
    }
    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      monthlyRevenue.push({ month: key, revenue: monthlyMap.get(key) ?? 0 })
    }

    const topProductIds = topProductsRaw.map((p: { productId: string }) => p.productId)
    const topProductsRawData = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true },
    })
    const topProductsMap = new Map<string, { id: string; name: string; price: number }>(
      topProductsRawData.map((p: any) => [p.id, p as { id: string; name: string; price: number }])
    )
    const topProducts = topProductsRaw.map(
      (p: { productId: string; _sum: { qty: number | null } }) => ({
        productId: p.productId,
        name: topProductsMap.get(p.productId)?.name ?? "Unknown",
        totalQty: p._sum.qty ?? 0,
      })
    )

    const lowStockFormatted = lowStockProducts.map((p: { id: string; name: string; stock_qty: number; min_stock_alert: number }) => ({
      id: p.id,
      name: p.name,
      stockQty: p.stock_qty,
      minStockAlert: p.min_stock_alert,
    }))

    let totalRevenue = 0
    let totalCost = 0
    for (const tx of allPaidTransactions) {
      for (const item of tx.items) {
        totalRevenue += item.priceAtSale * item.qty
        totalCost += (item.product?.costPrice ?? 0) * item.qty
      }
    }

    const profitSummary = {
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
    }

    return Response.json({
      todayRevenue,
      todayTransactions,
      weeklyRevenue,
      monthlyRevenue,
      topProducts,
      lowStockProducts: lowStockFormatted,
      profitSummary,
    })
  } catch (error) {
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
