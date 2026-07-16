import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    })
    return Response.json(categories)
  } catch (error) {
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type } = body

    if (!name || !type) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        createdBy: session.user.id,
      },
    })

    return Response.json(category, { status: 201 })
  } catch (error) {
    return Response.json({ error: "Failed to create category" }, { status: 500 })
  }
}
