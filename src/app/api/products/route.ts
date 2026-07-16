import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    })
    return Response.json(products)
  } catch (error) {
    return Response.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, costPrice, imageUrl, categoryId, stockQty, minStockAlert } = body

    if (!name || price === undefined || !categoryId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        costPrice: costPrice ?? 0,
        imageUrl,
        categoryId,
        stockQty: stockQty ?? 0,
        minStockAlert: minStockAlert ?? 5,
      },
      include: { category: true },
    })

    return Response.json(product, { status: 201 })
  } catch (error) {
    return Response.json({ error: "Failed to create product" }, { status: 500 })
  }
}
