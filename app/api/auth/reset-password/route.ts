import { NextResponse } from "next/server"
import { resetPassword } from "@/lib/password-reset"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { token, password } = await request.json().catch(() => ({}))
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 })
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ errors: { password: "Password must be at least 8 characters" } }, { status: 400 })
  }
  const result = await resetPassword(token, password)
  if (result === "invalid") {
    return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
