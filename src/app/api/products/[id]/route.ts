import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    return Response.json(product)
  } catch (error) {
    return Response.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { name, description, price, costPrice, imageUrl, categoryId, stockQty, minStockAlert } = body

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(costPrice !== undefined && { costPrice }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId }),
        ...(stockQty !== undefined && { stockQty }),
        ...(minStockAlert !== undefined && { minStockAlert }),
      },
      include: { category: true },
    })

    return Response.json(product)
  } catch (error) {
    return Response.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    return Response.json({ message: "Product deleted" })
  } catch (error) {
    return Response.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
