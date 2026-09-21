import { NextRequest } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"

export async function canManageQrLinks(request: NextRequest) {
  const configuredToken = process.env.QR_ADMIN_TOKEN
  const authHeader = request.headers.get("authorization")

  if (
    configuredToken &&
    authHeader?.startsWith("Bearer ") &&
    authHeader.slice("Bearer ".length) === configuredToken
  ) {
    return true
  }

  const user = await getAuthUserFromRequest(request)
  if (!user) return false

  return isUserAdmin(user.id, true)
}
