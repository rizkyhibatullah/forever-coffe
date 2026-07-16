import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, type } = body

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Category not found" }, { status: 404 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
      },
    })

    return Response.json(category)
  } catch (error) {
    return Response.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Category not found" }, { status: 404 })
    }

    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return Response.json(
        { error: "Cannot delete category with existing products" },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { id } })

    return Response.json({ message: "Category deleted" })
  } catch (error) {
    return Response.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
