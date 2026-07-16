import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    if (existing.role === "owner") {
      const ownerCount = await prisma.user.count({ where: { role: "owner" } })
      if (ownerCount <= 1) {
        return Response.json({ error: "Cannot delete the last owner" }, { status: 409 })
      }
    }

    await prisma.user.delete({ where: { id } })

    return Response.json({ message: "User deleted" })
  } catch (error) {
    return Response.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
