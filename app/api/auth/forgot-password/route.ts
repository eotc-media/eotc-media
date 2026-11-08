import { NextResponse } from "next/server"
import { requestPasswordReset } from "@/lib/password-reset"

export const runtime = "nodejs"

// Always answers the same way, whether or not the address has an account.
export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}))
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 })
  }
  await requestPasswordReset(email)
  return NextResponse.json({ ok: true })
}
