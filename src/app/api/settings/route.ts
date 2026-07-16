import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await prisma.setting.findUnique({ where: { id: "default" } })
    return Response.json(settings)
  } catch (error) {
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { cafeName, cafeLogo, qrisImageUrl, taxPercentage } = body

    const settings = await prisma.setting.upsert({
      where: { id: "default" },
      update: {
        ...(cafeName !== undefined && { cafeName }),
        ...(cafeLogo !== undefined && { cafeLogo }),
        ...(qrisImageUrl !== undefined && { qrisImageUrl }),
        ...(taxPercentage !== undefined && { taxPercentage }),
      },
      create: {
        id: "default",
        cafeName: cafeName ?? "Forever Caffe",
        cafeLogo: cafeLogo ?? null,
        qrisImageUrl: qrisImageUrl ?? null,
        taxPercentage: taxPercentage ?? 0,
      },
    })

    return Response.json(settings)
  } catch (error) {
    return Response.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
