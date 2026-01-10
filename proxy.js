import { updateSession } from "./lib/supabase/proxy"

export async function middleware(request) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public/).*)"],
}
