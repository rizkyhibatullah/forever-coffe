import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    return Response.json({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    })
  } catch {
    return Response.json({ error: "Failed to get user" }, { status: 500 })
  }
}
